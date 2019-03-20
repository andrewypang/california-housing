var startDate = new Date();

var CensusDataAPIKey = "42518e77865b671d0fe762fdf3151be2209dd058";
var ZOOM_OUT = 6;
var ZOOM_IN = 9;


//Defining map as a global variable to access from other functions
var map;
var dataset_housing = {
	data: null,
	analyze: {
		maxValues: null,
		minValues: null
	}
};
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
    //var selectBox = document.getElementById('overlay_style');
    // google.maps.event.addDomListener(selectBox, 'change', function() {
    //     clearCensusData();
    //     loadCensusData(selectBox.options[selectBox.selectedIndex].value);
    // });

    // google.maps.event.addDomListener(selectBox, 'zoom_changed', function() {

    // });

	parseHousingDataJSON();

	parseGeoJSON();

	

	//mergeDatasets(); //Call only if needed ie when moving one dataset value to another

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
		// O(n)

		var startTemp = new Date();

		var markers = [];
		dataset_housing['data'].forEach( function(entry) {
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

function mergeDatasets(){
	var entryCounter = 0;
	var temp = [];
	for(var i = 20000; i < dataset_housing['data'].length; i++)
	{
		entryCounter += 1;
		if((entryCounter % 100) == 0)
		{
			console.log(entryCounter);
		}


	 	var entry = dataset_housing['data'][i];
	 	var entry_position = new google.maps.LatLng(parseFloat(entry.latitude), parseFloat(entry.longitude));
		map.data.forEach(function(feature) {
			if(feature.getGeometry().getType() === 'Polygon')
			{
				var polyPath = feature.getGeometry().getAt(0).getArray();
				var poly = new google.maps.Polygon({
					paths: polyPath
				});

				if(google.maps.geometry.poly.containsLocation(entry_position, poly))
				{
					var name_of_county_value = feature.getProperty("NAME");
					entry["county_name"] = name_of_county_value;
					temp.push(entry);
				}
			}
			else if(feature.getGeometry().getType() === 'MultiPolygon')
			{
				var array = feature.getGeometry().getArray();

				array.forEach( function(item, i) {
		            var polyPath= item.getAt(0).getArray();
		            var poly = new google.maps.Polygon({
		              paths: polyPath
		            });

		            if(google.maps.geometry.poly.containsLocation(entry_position, poly)) {
		            	var name_of_county_value = feature.getProperty("NAME");
						entry["county_name"] = name_of_county_value;
						temp.push(entry);
		            }	
				});

			}
			else
			{
				console.error("Fix:" + feature.getGeometry().getType());
			}

		});
	}

	var data  = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(temp));

	var a       = document.createElement('a');
	a.href      = 'data:' + data;
	a.download  = 'data.json';
	a.innerHTML = 'download .txt file of json';

	document.getElementById('tab-2').appendChild(a);
}

function updateCountyLevelDisplay() {

	// DIV = selected-county
	var list = document.getElementById("selected-county");
	while (list.firstChild)
	{
	    list.removeChild(list.firstChild);
	}

	var countyList = document.getElementById("selected-county");
	var subCountyArray = [];

	map.data.forEach(function(feature_county) {

		// Check which county is selected
		if(feature_county.getProperty('isColorful'))
		{

			var entryCount = 0;
			var subCountyObject = {
					longitude:	0,
					latitude:	0,
					housing_median_age:	0,
					total_rooms: 0,
					total_bedrooms:	0,
					population:	0,
					households:	0,
					median_income: 0,
					median_house_value: 0,
					ocean_proximity: 0,
					county_name: 0
			};

			// Sum up the total data from each entry
			dataset_housing['data'].forEach( function(entry) {
				// Match dataset_housing with map.data.GeoJSON dataset
				if(entry['county_name'] == feature_county.getProperty('NAME'))
				{
					entryCount += 1;

					subCountyObject['housing_median_age'] += entry.housing_median_age; 
					subCountyObject['total_rooms'] += entry.total_rooms;
					subCountyObject['total_bedrooms'] += entry.total_bedrooms;
					subCountyObject['population'] += entry.population;
					subCountyObject['households'] += entry.households;
					subCountyObject['median_income'] += entry.median_income;
					subCountyObject['median_house_value'] += entry.median_house_value;
					subCountyObject['ocean_proximity'] += entry.ocean_proximity;
					subCountyObject['county_name'] = entry['county_name'];

				}
			}); // close For Each housing dataset entries
			subCountyArray.push(subCountyObject);

			var county = document.createElement('div');
			county.setAttribute("class", "county");

			// Create the County Name label
			var countyName = document.createElement('h4');
			countyName.style.height = "20px"; 
			countyName.appendChild( document.createTextNode(feature_county.getProperty('NAME')) );
			county.appendChild(countyName);

			// Create the County Stats list
			var countyStats = document.createElement('ul');
			countyStats.setAttribute("class", "county-stats");

			var li = document.createElement("li");
			li.appendChild(document.createTextNode("Number of Data Points: "));
			li.appendChild(document.createTextNode(entryCount)); 
			countyStats.appendChild(li);

			var li = document.createElement("li");
			li.appendChild(document.createTextNode("Population: "));
			li.appendChild(document.createTextNode(subCountyObject['population'])); 
			countyStats.appendChild(li);

			var li = document.createElement("li");
			li.appendChild(document.createTextNode("Median Income: "));
			li.appendChild(document.createTextNode( ((subCountyObject['median_income']/entryCount)*10000).toLocaleString() )); 
			countyStats.appendChild(li);

			var li = document.createElement("li");
			li.appendChild(document.createTextNode( "Median House Value: "));
			li.appendChild(document.createTextNode( (subCountyObject['median_house_value']/entryCount).toLocaleString() )); 
			countyStats.appendChild(li);

			county.appendChild(countyStats);

			countyList.appendChild(county);
		}

	// DIV = d3chart
	// var canvas = d3.select("#d3chart")
	// 			.append("svg:svg")
	// 			.attr("width", 300)
	// 			.attr("height", 300);

	});  // close For Each map.data

	// Color Stats
	var highValueNodeList = {
		"numOfData": null,
		"population": null,
		"median_income": null,
		"median_house_value": null
	};
	var highValues = {
		"numOfData": -Number.MAX_VALUE,
    	"longitude": -Number.MAX_VALUE,
	    "latitude": -Number.MAX_VALUE,
	    "housing_median_age": -Number.MAX_VALUE,
	    "total_rooms": -Number.MAX_VALUE,
	    "total_bedrooms": -Number.MAX_VALUE,
	    "population": -Number.MAX_VALUE,
	    "households": -Number.MAX_VALUE,
	    "median_income": -Number.MAX_VALUE,
	    "median_house_value": -Number.MAX_VALUE,
	    "ocean_proximity": -Number.MAX_VALUE,
	    "county_name": -Number.MAX_VALUE
	}
	var lowValueNodeList = {
		"numOfData": null,
		"population": null,
		"median_income": null,
		"median_house_value": null
	};
	var lowValues = {
		"numOfData": Number.MAX_VALUE,
    	"longitude": Number.MAX_VALUE,
	    "latitude": Number.MAX_VALUE,
	    "housing_median_age": Number.MAX_VALUE,
	    "total_rooms": Number.MAX_VALUE,
	    "total_bedrooms": Number.MAX_VALUE,
	    "population": Number.MAX_VALUE,
	    "households": Number.MAX_VALUE,
	    "median_income": Number.MAX_VALUE,
	    "median_house_value": Number.MAX_VALUE,
	    "ocean_proximity": Number.MAX_VALUE,
	    "county_name": Number.MAX_VALUE
	}

	var countyElements = document.getElementsByClassName('county');
	if(countyElements.length > 1)
	{
		for(var i = 0; i < countyElements.length; i++)
		{
			var county_node = countyElements[i];
			var county_name_node = county_node.firstChild;
			var county_ul_node = county_node.lastChild;

			var numOfData_il_node = county_ul_node.childNodes[0];
			var numOfData_value = parseFloat(numOfData_il_node.childNodes[1].textContent);
			if(numOfData_value > highValues['numOfData'])
			{
				highValues['numOfData'] = numOfData_value;
				highValueNodeList['numOfData'] = numOfData_il_node;
			}
			if(numOfData_value < lowValues['numOfData'])
			{
				lowValues['numOfData'] = numOfData_value;
				lowValueNodeList['numOfData'] = numOfData_il_node;
			}

			var population_il_node = county_ul_node.childNodes[1];
			var population_value = parseFloat(population_il_node.childNodes[1].textContent);
			if(population_value > highValues['population'])
			{
				highValues['population'] = population_value;
				highValueNodeList['population'] = population_il_node;
			}
			if(population_value < lowValues['population'])
			{
				lowValues['population'] = population_value;
				lowValueNodeList['population'] = population_il_node;
			}

			var median_income_il_node = county_ul_node.childNodes[2];
			var median_income_value = parseFloat(median_income_il_node.childNodes[1].textContent);
			if(median_income_value > highValues['median_income'])
			{
				highValues['median_income'] = median_income_value;
				highValueNodeList['median_income'] = median_income_il_node;
			}
			if(median_income_value < lowValues['median_income'])
			{
				lowValues['median_income'] = median_income_value;
				lowValueNodeList['median_income'] = median_income_il_node;
			}

			var median_house_value_il_node = county_ul_node.childNodes[3];
			var median_house_value_value = parseFloat(median_house_value_il_node.childNodes[1].textContent);
			if(median_house_value_value > highValues['median_house_value'])
			{
				highValues['median_house_value'] = median_house_value_value;
				highValueNodeList['median_house_value'] = median_house_value_il_node;
			}
			if(median_house_value_value < lowValues['median_house_value'])
			{
				lowValues['median_house_value'] = median_house_value_value;
				lowValueNodeList['median_house_value'] = median_house_value_il_node;
			}

		}

		highValueNodeList['numOfData'].style.color = "green";
		highValueNodeList['population'].style.color = "green";
		highValueNodeList['median_income'].style.color = "green";
		highValueNodeList['median_house_value'].style.color = "green";

		lowValueNodeList['numOfData'].style.color = "red";
		lowValueNodeList['population'].style.color = "red";
		lowValueNodeList['median_income'].style.color = "red";
		lowValueNodeList['median_house_value'].style.color = "red";

	}

       
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

			dataset_housing["data"].forEach( function(entry)
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
			});

			heatmap = new google.maps.visualization.HeatmapLayer({
				data: heatmapData,
				dissipating: true,
				radius: 20,
				map: map
			});

			console.log("Success! Loaded Heatmap 1");
		}
		else if(document.getElementById("overlay_style").value == "heatmap_2")
		{
			//var low_color = hsla(5, 69%, 54%, 0.1);
			//console.log(low_color);

			var min_color = [5, 69, 64];
			var max_color = [151, 83, 34];

			var value_to_consider

			map.data.setStyle(function(feature){

				//delta represents where the value sits between the min and max
				var delta = (entry.population - dataset_housing['analyze']['minValues']['population'] ) / (dataset_housing['analyze']['maxValues']['population'] - dataset_housing['analyze']['minValues']['population']);


			  	var color = [];
			  	for (var i = 0; i < 3; i++) {
                  	// calculate an integer color based on the delta
                  	color[i] = (max_color[i] - min_color[i]) * delta + min_color[i];
              	}


			  	return /** @type {!google.maps.Data.StyleOptions} */({
				    fillColor: 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)',
				    strokeColor: color,
				    fillOpacity: 0.1,
				    strokeOpacity: 0.1,
				    strokeWeight: 2
			  	});
			});
		}
		

	}());

}

function startButtonEvents () {
	// document.getElementById('btnResetZoom').addEventListener('click', function(){ resetZoom(); });
	// document.getElementById('btnZoomToSC').addEventListener('click', function(){ zoomToSantaCruz(); });
	// document.getElementById('btnZoomToSJ').addEventListener('click', function(){ zoomToSanJose(); });
	// document.getElementById('btnZoomToSF').addEventListener('click', function(){ zoomToSanFrancisco(); });
	// document.getElementById('btnZoomToLA').addEventListener('click', function(){ zoomToLosAngeles(); });
	document.getElementById('btnUpdateCountyLevelDisplay').addEventListener('click', function(){ updateCountyLevelDisplay(); });
	document.getElementById('btnUpdateStateLevelDisplay').addEventListener('click', function(){ updateStateLevelDisplay(); });
	document.getElementById('btnClearSelection').addEventListener('click', function(){ clearSelection(); });
	
	
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
	    	initIndex();
	    },
	    error: function (xhr, textStatus, errorThrown) {
	        console.log("parseGeoJSON: Error: " + xhr + textStatus);
	    }
	});


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

    	updateSelectedCountyList();

    });

    // Set mouseover event for each feature.
    map.data.addListener('mouseover', function(event) {
    	document.getElementById('hover-label').textContent = event.feature.getProperty('NAME');
    });

    map.data.addListener('mouseout', function(event) {
    	document.getElementById('hover-label').textContent = "";
    });

}

function updateSelectedCountyList() {
	var list_node = document.getElementById('selected-county-list');
	while (list_node.firstChild)
	{
	    list_node.removeChild(list_node.firstChild);
	}

	map.data.forEach(function(feature) {
		if(feature.getProperty('isColorful')) {
			var li = document.createElement("li");
			li.appendChild(document.createTextNode( feature.getProperty('NAME') ));
			list_node.appendChild(li);
		}
	});
}

function parseHousingDataJSON() {
	// Read in housing data from JSON file
	$.getJSON("datasets/dataset_housing_pp.json", function(raw_json) {
	    //console.log(json); // this will show the info it in firebug console
	    //dataset_housing = json;
	    var tempHousingArrayHolder = [];
	    var maxValues = {
	    	"longitude": -Number.MAX_VALUE,
    	    "latitude": -Number.MAX_VALUE,
    	    "housing_median_age": -Number.MAX_VALUE,
    	    "total_rooms": -Number.MAX_VALUE,
    	    "total_bedrooms": -Number.MAX_VALUE,
    	    "population": -Number.MAX_VALUE,
    	    "households": -Number.MAX_VALUE,
    	    "median_income": -Number.MAX_VALUE,
    	    "median_house_value": -Number.MAX_VALUE,
    	    "ocean_proximity": -Number.MAX_VALUE,
    	    "county_name": -Number.MAX_VALUE
	    }
	    var minValues = {
	    	"longitude": Number.MAX_VALUE,
    	    "latitude": Number.MAX_VALUE,
    	    "housing_median_age": Number.MAX_VALUE,
    	    "total_rooms": Number.MAX_VALUE,
    	    "total_bedrooms": Number.MAX_VALUE,
    	    "population": Number.MAX_VALUE,
    	    "households": Number.MAX_VALUE,
    	    "median_income": Number.MAX_VALUE,
    	    "median_house_value": Number.MAX_VALUE,
    	    "ocean_proximity": Number.MAX_VALUE,
    	    "county_name": Number.MAX_VALUE
	    }

	    var headers = [ "longitude", "latitude", "housing_median_age", "total_rooms", "total_bedrooms", "population", "households", "median_income", "median_house_value", "ocean_proximity", "county_name"];

	    raw_json.forEach(function(entry) {
	    	// Check if any are empty
	    	// else insert into dataset
	    	var pass = true;
	    	for(var i = 0; i < headers.length; i++)
	    	{
	    		if(!entry[headers[i]])
	    		{
					pass = false;
	    		}
	    	}
	    	if(pass)
	    	{
	    		tempHousingArrayHolder.push(entry);

	    		// Find max and min
	    		for(var i = 0; i < headers.length; i++)
	    		{
	    			if(entry[headers[i]] > maxValues[headers[i]])
	    			{
	    				maxValues[headers[i]] = entry[headers[i]];
	    			}
	    			if(entry[headers[i]] < minValues[headers[i]])
	    			{
	    				minValues[headers[i]] = entry[headers[i]];
	    			}
	    		}
	    	}
	    });

	    //Enter into dataset_housing
	    dataset_housing['data'] = tempHousingArrayHolder;
	    dataset_housing['analyze']['maxValues'] = maxValues;
	    dataset_housing['analyze']['minValues'] = minValues;

		document.getElementById("overlay_style").disabled = false;

	});
}

/* Set the width of the side navigation to 250px */
function openNav() {
  document.getElementById("mySidenav").style.width = "auto";
}

/* Set the width of the side navigation to 0 */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}

function initIndex() {
	var index_list_node = document.getElementById("index-list");

	map.data.forEach(function(feature){
		var option = document.createElement("option");
		option.text = feature.getProperty("NAME");
		index_list_node.add(option);
	});

	// Sort options
	$(function() {
	  // choose target dropdown
	  var select = $('#index-list');
	  select.html(select.find('option').sort(function(x, y) {
	    // to change to descending order switch "<" for ">"
	    return $(x).text() > $(y).text() ? 1 : -1;
	  }));
	});

	index_list_node.addEventListener('click', function(event){

		clearSelection();

		var listOfCountyNames = $('#index-list').val();

		for(var i = 0; i < listOfCountyNames.length; i++)
		{
			map.data.forEach( function(entry)
			{
				if(entry.getProperty('NAME') == listOfCountyNames[i])
				{
					entry.setProperty('isColorful', true );
				}
			});

		}

		updateSelectedCountyList();
	});

}

function clearSelection() {
	map.data.forEach(function(entry){
		entry.setProperty('isColorful', false );
	});

	updateSelectedCountyList();
}
