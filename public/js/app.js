	var map = null;
	var mapMarkers = [];
	var locationMarker = null;

	var socket = null;
	var lat = 0;
	var lng = 0;
	
	$(function(){

		socket = io();

		socket.on("search-results", function(list, finish){
			console.log(list, finish);

			if( finish === true){
				$("#indicator").hide();
			}
			

			if( list && list.length > 0){
				$.each(list, function(i, pokemon){
					
					if( pokemon.Type === "map" || pokemon.Type === "wild" ){

						var title = pokemon.Type == "wild" ?  'Wild '+ pokemon.name+" - "+ time2Str(pokemon.Time): pokemon.name;

						var markerImage = new google.maps.MarkerImage("/img/"+pokemon.num+".png",
			                new google.maps.Size(50, 50),
			                new google.maps.Point(0, 0),
			                new google.maps.Point(25, 25)
			            );

			            var infowindow = new google.maps.InfoWindow({
						    content: title
						  });

						var marker = new google.maps.Marker({
					          position: { lat: pokemon.Latitude, lng: pokemon.Longitude },
					          map: map,
					          title: title,
					          icon: markerImage
					    });

					    marker.addListener("click", function(){
					    	infowindow.open(map, marker);
					    });

						mapMarkers.push( marker);

					}else if( pokemon.lat && pokemon.lng){
						// debug
						mapMarkers.push( new google.maps.Marker({
					          position: { lat: pokemon.lat, lng: pokemon.lng },
					          map: map,
					          title: "point",
					        })
				        );
					}

					

				});
			}
		});

		$("#map").height($(window).height());

		getLocation(function(position, err){
			if( position !== null){
				lat = position.coords.latitude;
				lng = position.coords.longitude;
				setMapPosition(lat, lng);
				map.setZoom(16);

			}
		});

		$("#toolbar a.button").on("click", search);

		

	});

	function getLocation(callback) {
    	if (navigator.geolocation) {
    	    navigator.geolocation.getCurrentPosition(callback);
    	} else {
    	    callback(null, "Geolocation is not supported by this browser.");
    	}
	}



	function setMapPosition(lat, lng){
		map.setCenter(new google.maps.LatLng( lat, lng ) );

		locationMarker = new google.maps.Marker({
          position: { lat: lat, lng: lng},
          map: map,
          title: "Search around this location.",
        })
	}


	function initMap() {
		map = new google.maps.Map(document.getElementById('map'), {
		  center: {lat: -34.397, lng: 150.644},
		  zoom: 8
		});

		google.maps.event.addListener(map, 'click', function(event) {
			locationMarker.setPosition( event.latLng );
    		map.panTo( event.latLng );

    		lat = event.latLng.lat();
    		lng = event.latLng.lng();
		});
	}

	function clearMarkers(){
		mapMarkers.forEach(function(m){
			m.setMap(null);
		});
		mapMarkers = [];
	}

	function search(){
		map.setZoom(16);
		socket.emit("search", {lat:lat, lng:lng});
		clearMarkers();

		$("#indicator").show();
	}	

	function time2Str(sec){
		var min = Math.floor(sec / 60);
		var s = sec % 60;

		if(sec >= 0){
			return min > 0 ? min+"m "+s+"s": s+"s";
		}else{
			return "(might not be visible yet)";
		}
	}
