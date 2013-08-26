function ApplicationModel() {
	var self = this;

	self.retailOrders = ko.observable(new OrderModel());
	self.statesMap = ko.observable(new MapModel());

	self.start = function() {
		// Load initial state from server
		$.getJSON("/xd-demo-client/orders", function(data) {
			self.retailOrders().loadOrders(data);
		});

	}

	self.refresh = function() {
		// Reload state from server
		$.getJSON("/xd-demo-client/orders", function(data) {
			self.retailOrders().reloadOrders(data);
		});
		self.statesMap().reloadMap();
	}
}

function OrderModel() {
	var self = this;
	self.rows = ko.observableArray();
	self.runningTotal = ko.observable(null);
	var rowLookup = {};

	self.loadOrders = function(orders) {
		var total = 0;
		for ( var i = 0; i < orders.length; i++) {
			var row = new OrderRow(orders[i]);
			self.rows.push(row);
			total += row.orderAmount;
			rowLookup[row.orderId] = row;
		}
		self.runningTotal("$" + total.toFixed(2));
	};

	self.reloadOrders = function(orders) {
		self.rows.removeAll();
		var total = 0;
		for ( var i = 0; i < orders.length; i++) {
			var row = new OrderRow(orders[i]);
			self.rows.push(row);
			total += row.orderAmount;
			rowLookup[row.orderId] = row;
		}
		self.runningTotal("$" + total.toFixed(2));
	};

};

function OrderRow(data) {
	var self = this;
	self.storeId = data.storeId;
	self.customerId = data.customerId;
	self.orderAmount = data.orderAmount;
	self.formattedOrderAmount = ko.computed(function() {
		return "$" + self.orderAmount.toFixed(2);
	});
	self.orderId = data.orderId;
	self.numItems = data.numItems;

	self.change = ko.observable(0);
	self.arrow = ko.observable();
};

// MAP CODE STARTS HERE
function MapModel() {
	
	var self = this;
	var mapVisible = false;
	
	self.toggleMap = function() {
		
		if (mapVisible == false)
		{
			mapVisible = true;
			loadMap();
		}
		else
		{
			mapVisible = false;
			hideMap();
		}
	}
	
    self.reloadMap = function() {
		if (mapVisible == true)
		{
			d3.select("svg").remove()
			loadMap();
			d3.select("svg").style("opacity", "1").transition().duration(10000).style("opacity", "0");
		}
	}
	
	hideMap = function() {
		d3.select("svg").remove();
	}

	loadMap = function() {
		// Width and height
		var w = 800;
		var h = 500;

		// Define map projection
		var projection = d3.geo.albersUsa().translate([ w / 2, h / 2 ]).scale(
				[ 900 ]);

		// Define path generator
		var path = d3.geo.path().projection(projection);

		// Define quantize scale to sort data values into buckets of color
		var color = d3.scale.quantize().range([ "#006600", "#FF6666", "#CC0000" ]);
		// Colors taken from colorbrewer.js, included in the D3 download
		
		// Create SVG element
		var svg = d3.select("#usmap").append("svg").attr("width", w).attr(
				"height", h).attr("opacity", "1");
		
		// Load in agriculture data
		// d3.csv("us-ag-productivity-2004.csv", function(data) {
		d3.json("/xd-demo-client/ordersumbystate", function(data) {
			// Set input domain for color scale
			color.domain([ d3.min(data, function(d) {
				return d.orderAmount;
			}), d3.max(data, function(d) {
				return d.orderAmount;
			}) ]);

			// Load in GeoJSON data
			d3.json("us-states.json", function(json) {

				// Merge the ag. data and GeoJSON
				// Loop through once for each ag. data value
				for ( var i = 0; i < data.length; i++) {

					// Grab state name
					var dataState = data[i].stateId;

					// Grab data value, and convert from string to float
					var dataValue = parseFloat(data[i].orderAmount);

					// Find the corresponding state inside the GeoJSON
					for ( var j = 0; j < json.features.length; j++) {

						// var jsonState = json.features[j].properties.name;
						var jsonState = json.features[j].id;

						if (dataState == jsonState) {

							// Copy the data value into the JSON
							json.features[j].properties.value = dataValue;

							// Stop looking through the JSON
							break;

						}
					}
				}

				// Bind data and create one path per GeoJSON feature
				svg.selectAll("path").data(json.features).enter()
						.append("path").attr("d", path).style("fill",
								function(d) {
									// Get data value
									var value = d.properties.value;

									if (value) {
										// If value exists�
										return color(value);
									} else {
										// If value is undefined�
										return "#006600";
									}
								});
			});
		});
	};
	
};