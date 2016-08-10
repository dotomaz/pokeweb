var PokemonGO = require('pokemon-go-node-api');
var s2 = require('s2geometry-node');

var rad = function(x){
	return x * Math.PI / 180;
}

var deg = function(x){
	return x * 180 / Math.PI;
}

var newLocation = function(pos, distance, bearing){

	R = 6378.1;
	var rBearing = bearing * Math.PI / 180;
	var rPos = {
		lat: rad(pos.lat),
		lng: rad(pos.lng)
	};

	var lat = Math.asin( 
				Math.sin(rPos.lat)*Math.cos(distance/R) + 
				Math.cos(rPos.lat)*Math.sin(distance/R)*Math.cos(rBearing)
			); 
	var lng = rPos.lng + Math.atan2(
							Math.sin(rBearing)*Math.sin(distance/R)*Math.cos(rPos.lat),
        					Math.cos(distance/R)-Math.sin(rPos.lat)*Math.sin(lat)
        				);
	return { lat:deg(lat), lng:deg(lng)};
}
 
var getScanPoints = function(startPoint, steps){

	const NORTH = 0;
	const NORTH_EAST = 30;
	const EAST = 90;
	const SOUTH_EAST = 150;
	const SOUTH = 180;
	const SOUTH_WEST = 210;
	const WEST = 270;
	const NORTH_WEST = 330;
	
	

	var dist = 0.10;
	var xdist = Math.sqrt(3)*0.1;
	var ydist = 3 * ( xdist / 2 )	

	var points = [];
	var ring = 1;
	var point = Object.assign({},startPoint);

	//

	while (ring <= steps){
		// top left point
		//point.lat += latDeltaDegrees;
		//point.lng -= lngDeltaDegrees(point.lat);

		point = newLocation(point, dist, NORTH_WEST);
		points.push( Object.assign({}, point));

		for(let direction=0; direction<6; direction++){
			for( let j=0; j<ring; j++){
				switch(direction){
					case 0: // right
						//point.lng += lngDeltaDegrees(point.lat) * 2;
						point = newLocation(point, dist, EAST);
						break;
					case 1: //right down
						//point.lat -= latDeltaDegrees;
						//point.lng += lngDeltaDegrees(point.lat);
						point = newLocation(point, dist, SOUTH_EAST);
						
						break;
					case 2: // left down
						//point.lat -= latDeltaDegrees;
						//point.lng -= lngDeltaDegrees(point.lat);
						point = newLocation(point, dist, SOUTH_WEST);
						break;
					case 3: // left
						//point.lng -= lngDeltaDegrees(point.lat)*2;
						point = newLocation(point, dist, WEST);
						break;
					case 4: // left up
						//point.lat += latDeltaDegrees;
						//point.lng -= lngDeltaDegrees(point.lat);
						point = newLocation(point, dist, NORTH_WEST);
						break;
					case 5: // right up
						//point.lat += latDeltaDegrees;
						//point.lng += lngDeltaDegrees(point.lat);
						point = newLocation(point, dist, NORTH_EAST);
						break;

				}
				points.push( Object.assign({}, point));
			}
		}

		ring++;
	}
	return points;
};



var search = function(lat, lng, callback){
	var pgo = new PokemonGO.Pokeio();

	var location = {
		type:"coords",
		coords: {
			latitude: lat,
			longitude: lng
		}
	}	

	var username = process.env.USERNAME || "USER";
	var password = process.env.PASSWORD || "PASS";
	var provider = process.env.PROVIDER || "google";

	//console.log(username, password, provider);

	pgo.init(username, password, location, provider, function(err) {
	    if (err) throw err;

	    console.log('1[i] Current location: ' + pgo.playerInfo.locationName);
	    console.log('1[i] lat/long/alt: : ' + pgo.playerInfo.latitude + ' ' + pgo.playerInfo.longitude + ' ' + pgo.playerInfo.altitude);

	    pgo.GetProfile(function(err, profile) {
	        if (err) throw err;

	        console.log('1[i] Username: ' + profile.username);
	        console.log('1[i] Poke Storage: ' + profile.poke_storage);
	        console.log('1[i] Item Storage: ' + profile.item_storage);

	        var poke = 0;
	        if (profile.currency[0].amount) {
	            poke = profile.currency[0].amount;
	        }

	        console.log('1[i] Pokecoin: ' + poke);
	        console.log('1[i] Stardust: ' + profile.currency[1].amount);

	        var pos = {
				lat: pgo.playerInfo.latitude,
				lng: pgo.playerInfo.longitude
			}

			var locationsToScan = getScanPoints(pos, 3);
			var firstScan = false;

			//callback(locationsToScan, true);
			//return;

			var pokemonList = [];

	        var hbTimer = setInterval( function(){

	        	console.log("\nHeartbeat:\n");
	        	console.log('[i] lat/long/alt: : ' + pgo.playerInfo.latitude + ' ' + pgo.playerInfo.longitude + ' ' + pgo.playerInfo.altitude);

	        	callback({
	        		lat: pgo.playerInfo.latitude,
	        		lng: pgo.playerInfo.longitude
	        	}, false, "scan" );

	        	pgo.Heartbeat(function(err,hb) {
	                

	                if(err) {
	                    console.log(err);
	                }

	                var list = [];
	                var walkCells = [];


	                for (var i = hb.cells.length - 1; i >= 0; i--) {
	                	var cc = hb.cells[i];

	                	var cellId = new s2.S2CellId(cc.S2CellId.toString()) ;
	                	var cell = new s2.S2Cell( cellId);
	                	var latLng = new s2.S2LatLng(cell.getCenter()).toString() ;

	                	var tt = latLng.split(",").map(parseFloat);
	                	var cellPos = { lat:tt[0], lng: tt[1] };

	                	walkCells.push(cellPos);
	                	
	                	//list.push(latLng);

	                    if(cc.NearbyPokemon && cc.NearbyPokemon.length > 0) {
	                    	cc.NearbyPokemon.forEach( function(pkm, i){
	                    		//console.log(pkm);
	                    		var pokemon = pgo.pokemonlist[parseInt(pkm.PokedexNumber)-1];
	                    		pokemon.Type = "nearby";
	                    		pokemon.DistanceMeters = pkm.DistanceMeters;
	                    		list.push(pokemon);
	                        	console.log('[+] There is a ' + pokemon.name + ' at ' + pkm.DistanceMeters + ' meters');
	                    	});
	                    }

	                    if(cc.MapPokemon && cc.MapPokemon.length > 0) {
	                    	cc.MapPokemon.forEach( function(pkm, i){
	                    		var pokemon = Object.assign({}, pgo.pokemonlist[parseInt(pkm.PokedexTypeId)-1]);
	                    		pokemon.Type = "map";
	                    		pokemon.Latitude = pkm.Latitude;
	                    		pokemon.Longitude = pkm.Longitude;
	                    		list.push(pokemon);
	                    		console.log('[+] There is a map pokemon ' + pokemon.name + ' at ' +  pokemon.Latitude + ', '+ pokemon.Longitude );
	                    	});
	                    }

	                    if(cc.MapPokemon && cc.WildPokemon.length > 0) {
	                    	cc.WildPokemon.forEach( function(pkm, i){
	                    		var pokemon = Object.assign({}, pgo.pokemonlist[parseInt(pkm.pokemon.PokemonId)-1]);
	                    		pokemon.Latitude = pkm.Latitude;
	                    		pokemon.Longitude = pkm.Longitude;
	                    		pokemon.Type = "wild";
	                    		pokemon.Time = Math.round(pkm.TimeTillHiddenMs/1000);
	                    		list.push(pokemon);
	                    		console.log('[+] There is a wild pokemon ' + pokemon.name + ' at ' +  pokemon.Latitude + ', '+ pokemon.Longitude+ ' for '+ pokemon.Time+'s' );
	                    	});
	                    }

	                   
	                }
					
					if( walkCells.length > 0 )  callback(walkCells, locationsToScan.length == 0, "cell" );
	                
	                if( list.length > 0 ) callback(list, locationsToScan.length == 0, "pokemon" );

	                if( locationsToScan.length > 0){
	                	pgo.playerInfo.latitude = locationsToScan[0].lat;
	                	pgo.playerInfo.longitude = locationsToScan[0].lng;
	                	locationsToScan.splice(0,1);
	                }

	                firstScan = false;

	                // are we finished
	                if( locationsToScan.length == 0){
	                	clearInterval(hbTimer);
	                	hbTimer = null;

	                	callback([], true);
	                }
	            });

	        }, 5000);

			
        
	    });
	});
}

module.exports = search;