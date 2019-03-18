var startDate = new Date();

var CensusDataAPIKey = "42518e77865b671d0fe762fdf3151be2209dd058";
var ZOOM_OUT = 6;
var ZOOM_IN = 9;


//Defining map as a global variable to access from other functions
var map;
var dataset_housing = null;
var housingCluster = null;
var heatmap = null;
var dataLayer = [];

function initMap(){
	var centerOfCali = new google.maps.LatLng(37.229722, -119.509444);
	var CALIFORNIA_BOUNDS = {
    	north: 45.296398,
        south: 25.717281,
        west: -134.174310,
        east: -109.663626
    };

	//Enabling new cartography and themes
	//google.maps.visualRefresh = true;
	//Setting starting options of map
	var mapOptions = {
		center: centerOfCali,
		zoom: ZOOM_OUT,
		minZoom: ZOOM_OUT,
		restriction: {
			latLngBounds: CALIFORNIA_BOUNDS,
			strictBounds: false,
		},
		disableDoubleClickZoom: true,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	//Getting map DOM element
	var mapElement = document.getElementById('mapDiv');
	//Creating a map with DOM element which is just obtained
	map = new google.maps.Map(mapElement, mapOptions);

	// Tab Panels
	$('.tab-list').each(function(){                   // Find lists of tabs
	  var $this = $(this);                            // Store this list
	  var $tab = $this.find('li.active');             // Get the active list item
	  var $link = $tab.find('a');                     // Get link from active tab
	  var $panel = $($link.attr('href'));             // Get active panel

	  $this.on('click', '.tab-control', function(e) { // When click on a tab
	    e.preventDefault();                           // Prevent link behavior
	    var $link = $(this),                          // Store the current link
	        id = this.hash;                           // Get href of clicked tab 

	    if (id && !$link.is('.active')) {             // If not currently active
	      $panel.removeClass('active');               // Make panel inactive
	      $tab.removeClass('active');                 // Make tab inactive

	      $panel = $(id).addClass('active');          // Make new panel active
	      $tab = $link.parent().addClass('active');   // Make new tab active 
	    }
	  });
	});


	// wire up the button
    var selectBox = document.getElementById('overlay_style');
    // google.maps.event.addDomListener(selectBox, 'change', function() {
    //     clearCensusData();
    //     loadCensusData(selectBox.options[selectBox.selectedIndex].value);
    // });

    google.maps.event.addDomListener(selectBox, 'zoom_changed', function() {

    });

	parseGeoJSON();

	$.getJSON("datasets/housing.json", function(json) {
	    console.log(json); // this will show the info it in firebug console
	    dataset_housing = json;
		document.getElementById("overlay_style").disabled = false;
	});

	$(document).ready()
	{
		var endDate   = new Date();
		console.log("Secs:"+(endDate.getTime() - startDate.getTime()) / 1000);
	}


}

/** Removes census data from each shape on the map and resets the UI. */
function clearCensusData() {
	censusMin = Number.MAX_VALUE;
	censusMax = -Number.MAX_VALUE;
	map.data.forEach(function(row){
		row.setProperty('census_variable', undefined);
	});
	//document.getElementById('data-box').style.display = 'none';
	//document.getElementById('data-caret').style.display = 'none';

	//Clear markers and heatmap
	if(housingCluster != null)
	{
		housingCluster.clearMarkers();
	}
	if(heatmap != null)
	{
		//heatmap.getMap() != null
		heatmap.setMap(null);
	}
	if(dataLayer.length != 0)
	{
		for(var i = 0; i < dataLayer.length; i++)
		{
			dataLayer[i].setMap(null);
			dataLayer[i] = null;
		}
		dataLayer = [];
	}
}

function loadCensusData(variable) {
	var dataMin = Number.MAX_VALUE;
	var dataMinName = "";
	var dataMax = -Number.MAX_VALUE;
	var dataMaxName = "";
	var dataMinMarker;
	var dataMaxMarker;

	if(variable == "None")
	{

	}
	else if(variable == "HouseMarkers")
	{
		//NEED TO CHANGE HOUSE MARKERS TO COUNTY LEVEL

		var startTemp = new Date();

		var markers = [];
		dataset_housing.forEach( function(entry) {
			var entry_position = new google.maps.LatLng(entry.latitude, entry.longitude);

			var MarkerOptions = {
				position: entry_position,
				opacity: 0.5,
				clickable: true,
				map: map
			};

	  		var numberFormatter = new Intl.NumberFormat();
	  		var moneyFormatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD', currencyDisplay: 'symbol'});

	  		var contentString = '<div class="housing-entry">' +
	  							'<ul>' + 
	  								'<li>' + 'Coordinates: (' + entry.latitude + ',' + entry.longitude + ')' + '</li>' +
	  								'<li>' + 'Housing Median Age: '+ numberFormatter.format(entry.housing_median_age) + '</li>' +
	  								'<li>' + 'Total Rooms: ' + numberFormatter.format(entry.total_rooms) + '</li>' +
	  								'<li>' + 'Total Bedrooms: ' +  (entry.total_bedrooms == null ? 'N/A' : numberFormatter.format(entry.total_bedrooms)) + '</li>' +
	  								'<li>' + 'Population: ' + numberFormatter.format(entry.population) + '</li>' +
	  								'<li>' + 'Households: ' + numberFormatter.format(entry.households) + '</li>' +
	  								'<li>' + 'Median Income: ' + moneyFormatter.format(entry.median_income*10000) + '</li>' +
	  								'<li>' + 'Median House Value: ' + moneyFormatter.format(entry.median_house_value) + '</li>' +
	  								'<li>' + 'Ocean Proximity: '+ entry.ocean_proximity + '</li>' +
	  							'</ul>' +
	          				    '</div>';

	        var infowindow = new google.maps.InfoWindow({
				content: contentString,
				maxWidth: 350
	        });

			var marker = new google.maps.Marker(MarkerOptions);

			marker.addListener('click', function() {
			  infowindow.open(map, marker);
			});

			markers.push(marker);
		});

		var MarkerClustererOptions = {
			imagePath: 'images/m', 
			zoomOnClick: false, 
			minimumClusterSize: 3
		};

		housingCluster = new MarkerClusterer(map, markers, MarkerClustererOptions);
		console.log("Success! Loaded House Markers");

		var endTemp   = new Date();
		console.log("Secs:"+(endTemp.getTime() - startTemp.getTime()) / 1000);
	}
	else if(variable == "HeatmapWithPopulation")
	{
		
	}
	else if(variable == "HeatmapWithMedianIncome")
	{
		// var heatmapData = [];
		// dataset_housing.forEach( function(entry)
		// {
		// 	var entry_position = new google.maps.LatLng(entry.latitude, entry.longitude);

		// 	var weightedLoc = {
		// 	    location: entry_position,
		// 	    weight: entry.median_income
		// 	};

		// 	heatmapData.push(weightedLoc);

		// 	if(entry.median_income < dataMin)
		// 	{
		// 		dataMin = entry.median_income;
		// 	}
		// 	if(entry.median_income > dataMax)
		// 	{
		// 		dataMax = entry.median_income;
		// 	}
		// });

		// heatmap = new google.maps.visualization.HeatmapLayer({
		// 	data: heatmapData,
		// 	dissipating: true,
		// 	radius: 20,
		// 	map: map
		// });

		// console.log("Success! Loaded Heatmap With Median-Income");
	}
	else if(variable == "HeatmapWithMedianHouseValue")
	{
		// var heatmapData = [];
		// dataset_housing.forEach( function(entry)
		// {
		// 	var entry_position = new google.maps.LatLng(entry.latitude, entry.longitude);

		// 	var weightedLoc = {
		// 	    location: entry_position,
		// 	    weight: entry.median_house_value
		// 	};

		// 	heatmapData.push(weightedLoc);

		// 	if(entry.median_house_value < dataMin)
		// 	{
		// 		dataMin = entry.median_house_value;
		// 	}
		// 	if(entry.median_house_value > dataMax)
		// 	{
		// 		dataMax = entry.median_house_value;
		// 	}
		// });

		// heatmap = new google.maps.visualization.HeatmapLayer({
		// 	data: heatmapData,
		// 	dissipating: true,
		// 	radius: 20,
		// 	map: map
		// });

		// console.log("Success! Loaded Heatmap With Median House Value");
	}

	// if( dataMin != Number.MAX_VALUE || dataMax != -Number.MAX_VALUE)
	// {
	// 	// update and display the legend
	// 	document.getElementById('census-min').textContent = dataMin.toLocaleString();
	// 	document.getElementById('census-max').textContent = dataMax.toLocaleString();

	// 	//document.getElementById('data-box').style.display = 'block';
	// }
	// else
	// {
	// 	// reset back to default min & max
	// 	document.getElementById('census-min').textContent = "min";
	// 	document.getElementById('census-max').textContent = "max";
	// 	//document.getElementById('data-box').style.display = 'none';
	// }


}


function resetZoom() {
	centerOfCali = map.center;
	map.setCenter(centerOfCali);
	map.setZoom(ZOOM_OUT);
}

function zoomToSantaCruz() {
       var SantaCruz = new google.maps.LatLng(36.971944, -122.026389);
       map.setCenter(SantaCruz);
       map.setZoom(ZOOM_IN);
}

function zoomToSanJose() {
       var SanJose = new google.maps.LatLng(37.333333, -121.9);
       map.setCenter(SanJose);
       map.setZoom(ZOOM_IN);
}

function zoomToSanFrancisco() {
       var SanFrancisco = new google.maps.LatLng(37.783333, -122.416667);
       map.setCenter(SanFrancisco);
       map.setZoom(ZOOM_IN);
}

function zoomToLosAngeles() {
       var LosAngeles = new google.maps.LatLng(34.05, -118.25);
       map.setCenter(LosAngeles);
       map.setZoom(ZOOM_IN);
}

function updateDataDisplay() {

	var list = document.getElementById("selected-county");
	while (list.firstChild)
	{
	    list.removeChild(list.firstChild);
	}


 	//Get headers
 	var subcounty_housing_median_age = subcounty_total_rooms = subcounty_total_bedrooms = subcounty_population = subcounty_households = subcounty_median_income = subcounty_median_house_value = subcounty_ocean_proximity = 0;
 	var entryCount = 0;

 	// SLOW AND COSTLY (1)
	map.data.forEach(function(feature) {
		if(feature.getProperty('isColorful'))
		{
			console.log(feature.getProperty('NAME') + " is selected");

			// Fix else if not polygon ie multipolygon
			if(feature.getGeometry().getType() === 'Polygon')
			{
				var polyPath = feature.getGeometry().getAt(0).getArray();
				var poly = new google.maps.Polygon({
					paths: polyPath
				});

				// SLOW AND COSTLY (2)
				dataset_housing.forEach( function(entry) {

					var entry_position = new google.maps.LatLng(entry.latitude, entry.longitude);

					if(google.maps.geometry.poly.containsLocation(entry_position, poly))
					{
						entryCount += 1;
						subcounty_housing_median_age += entry.housing_median_age; 
						subcounty_total_rooms += entry.total_rooms;
						subcounty_total_bedrooms += entry.total_bedrooms;
						subcounty_population += entry.population;
						subcounty_households += entry.households;
						subcounty_median_income += entry.median_income;
						subcounty_median_house_value += entry.median_house_value;
						subcounty_ocean_proximity += entry.ocean_proximity;
					}

				});

				var countyList = document.getElementById("selected-county");

				var county = document.createElement('div');
				county.setAttribute("class", "county");

				// Create the County Name label
				var countyName = document.createElement('h4');
				countyName.style.height = "20px"; 
				countyName.appendChild( document.createTextNode(feature.getProperty('NAME')) );
				county.appendChild(countyName);

				// Create the County Stats list
				var countyStats = document.createElement('ul');
				countyStats.setAttribute("class", "county-stats");

				var li = document.createElement("li");
				li.appendChild(document.createTextNode( "Number of Data Points: " + entryCount.toLocaleString() ));
				countyStats.appendChild(li);

				var li = document.createElement("li");
				li.appendChild(document.createTextNode( "Population: " + subcounty_population.toLocaleString() ));
				countyStats.appendChild(li);

				var li = document.createElement("li");
				li.appendChild(document.createTextNode( "Median Income: " + ((subcounty_median_income/entryCount)*10000).toLocaleString() ));
				countyStats.appendChild(li);

				var li = document.createElement("li");
				li.appendChild(document.createTextNode( "Median House Value: " + (subcounty_median_house_value/entryCount).toLocaleString() ));
				countyStats.appendChild(li);

				county.appendChild(countyStats);

				countyList.appendChild(county);
			}
 			else
 			{
 				console.log("Need fix:" + event.feature.getGeometry().getType());
 			}

		}
	});
       
}

function updateStateLevelDisplay() {
	(function() {
		var form = document.getElementById('selected_data_form');
		var elements = form.elements;
		var options = elements.selected_data;

		for(var i = 0; i < options.length; i++)
		{
			if(options[i].checked == true)
			{
				console.log(options[i].value + " is selected");
			}
		}

		// Clear any old data selection
		clearCensusData();

		// If heatmap was selected
		if(document.getElementById("overlay_style").value == "heatmap_1")
		{
			var heatmapData = [];
			var dataMinMarker;
			var dataMaxMarker;
			var dataMinLocation;
			var dataMaxLocation;
			var dataMinMarkerOptions;
			var dataMaxMarkerOptions;

			dataset_housing.forEach( function(entry)
			{
				var entry_position = new google.maps.LatLng(entry.latitude, entry.longitude);

				// Get weight for each data entry. For each data col that was selected, add to weight
				var entry_weight = 0;
				for(var i = 0; i < options.length; i++)
				{
					if(options[i].checked == true)
					{
						entry_weight += entry[options[i].value];
					}
				}


				var weightedLoc = {
				    location: entry_position,
				    weight: entry_weight
				};

				heatmapData.push(weightedLoc);

				// Final Min and Max
				// if(entry.population < dataMin)
				// {
				// 	dataMin = entry.population;
				// 	dataMinLocation = new google.maps.LatLng(entry.latitude, entry.longitude);
				// 	dataMinMarkerOptions = {
				// 		position: dataMinLocation,
				// 		opacity: 0.7,
				// 		icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" },
				// 		map: map
				// 	};
				// }
				// if(entry.population > dataMax)
				// {
				// 	dataMax = entry.population;
				// 	dataMaxLocation = new google.maps.LatLng(entry.latitude, entry.longitude);
				// 	dataMaxMarkerOptions = {
				// 		position: dataMaxLocation,
				// 		opacity: 0.7,
				// 		icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" },
				// 		map: map
				// 	};
				// }
			});

			heatmap = new google.maps.visualization.HeatmapLayer({
				data: heatmapData,
				dissipating: true,
				radius: 20,
				map: map
			});

			// dataMinMarker = new google.maps.Marker(dataMinMarkerOptions);
			// dataMaxMarker = new google.maps.Marker(dataMaxMarkerOptions);
			// dataLayer.push(dataMinMarker);
			// dataLayer.push(dataMaxMarker);

			console.log("Success! Loaded Heatmap 1");
		}
		else if(document.getElementById("overlay_style").value == "heatmap_2")
		{
			
		}
		

	}());

}

function startButtonEvents () {
	// document.getElementById('btnResetZoom').addEventListener('click', function(){ resetZoom(); });
	// document.getElementById('btnZoomToSC').addEventListener('click', function(){ zoomToSantaCruz(); });
	// document.getElementById('btnZoomToSJ').addEventListener('click', function(){ zoomToSanJose(); });
	// document.getElementById('btnZoomToSF').addEventListener('click', function(){ zoomToSanFrancisco(); });
	// document.getElementById('btnZoomToLA').addEventListener('click', function(){ zoomToLosAngeles(); });
	document.getElementById('btnUpdateDataDisplay').addEventListener('click', function(){ updateDataDisplay(); });
	document.getElementById('btnUpdateStateLevelDisplay').addEventListener('click', function(){ updateStateLevelDisplay(); });
	
}

startButtonEvents();

function parseGeoJSON() {
	$.ajax({
	    type: "POST",
	    url: "shapes/county-subdivision.json",
	    contentType: "application/json; charset=utf-8",
	    dataType: "json",
	    success: function(json) {
	    	map.data.addGeoJson(json);
	    },
	    error: function (xhr, textStatus, errorThrown) {
	        console.log("parseGeoJSON: Error: " + xhr + textStatus);
	    }
	});

	// Color each letter gray. Change the color when the isColorful property
    // is set to true.
    map.data.setStyle(function(feature) {
      var color = 'blue';
      if (feature.getProperty('isColorful')) {
        color = "red";
      }
      return /** @type {!google.maps.Data.StyleOptions} */({
        fillColor: color,
        strokeColor: color,
        fillOpacity: 0.1,
        strokeOpacity: 0.1,
        strokeWeight: 2
      });
    });

    // When the user clicks, set 'isColorful', changing the color
    map.data.addListener('click', function(event) {
    	event.feature.setProperty('isColorful', !(event.feature.getProperty('isColorful')) );

    }); // End of map.data.addListener('click', function(event)

    // Set mouseover event for each feature.
    map.data.addListener('mouseover', function(event) {
    	document.getElementById('hover-label').textContent = event.feature.getProperty('NAME');
    });

    map.data.addListener('mouseout', function(event) {
    	document.getElementById('hover-label').textContent = "";
    });

}
