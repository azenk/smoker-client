$(document).ready(function() {
		var tcArray = [];
		var fanArray = [];
		var spArray = [];

		var records = 360;
		var updateinterval = 5.0; 
		
		var chart = new CanvasJS.Chart("chartContainer",{
			title :{text: "Live Smoker Data"},
			axisX: {title: "Timestamp",titleFontSize: 20},
			axisY: {title: "Temperature", suffix: " C",titleFontSize: 20},
			axisY2: {title: "Fan Output",titleFontSize: 20},
			legend: {verticalAlign: "bottom"},
			zoomEnabled: true,

			data: [{
				type: "line",        
				showInLegend: true, 
				legendText: "Smoke Chamber",
				dataPoints : tcArray
			},{
				type: "line",
				showInLegend: true, 
				legendText: "Set Point",
				dataPoints : spArray
			},{
				type: "line",
				axisYType: "secondary",
				showInLegend: true, 
				legendText: "Fan",
				dataPoints: fanArray
			}
			]
		  });

		function init(){
				updateArrays();
				chart.render();
				setInterval(updateChart, updateinterval * 1000);
				setInterval(updateArrays, updateinterval * 1000);
		}

		function variableURL(variablename){
			var device = "48ff6b065067555023151787";
			var access_token = "1451c88ec0c225eb59e8474d3b986c595ca3d111";
			return "https://api.spark.io/v1/devices/".concat( device, "/", variablename, "?access_token=", access_token);
		}

		function updateArrays(){
			$.getJSON(variableURL("tctemp"),function(result){
				var tctemp_pct = result["result"];
				if (tctemp_pct <= 500 && tctemp_pct >= 0) {
					tcArray.push({x: new Date(result["coreInfo"]["last_heard"]), y: tctemp_pct});
					document.getElementById("tcTemp").innerHTML = "Current smoker temp: " +  precise_round(tctemp_pct,2) + " &deg;C";
				}
			});

			$.getJSON(variableURL("output"),function(result){
				var output_pct = result["result"]/255 * 100;
				if (output_pct <= 100 && output_pct >= 0){
					fanArray.push({x: new Date(result["coreInfo"]["last_heard"]), y: output_pct});
				}
			});

			$.getJSON(variableURL("setpoint"),function(result){
				var setpoint_pct = result["result"];
				if (setpoint_pct <= 500 && setpoint_pct >= 0){
					spArray.push({x: new Date(result["coreInfo"]["last_heard"]), y: setpoint_pct});
					document.getElementById("setTemp").innerHTML = "Set temp: " + setpoint_pct + " &deg;C";
				}
			});
			
			$.getJSON(variableURL("coldtemp"),function(result){
				document.getElementById("coldTemp").innerHTML = "Current cold temp: " + precise_round(result["result"],2) + " &deg;C";
			});
			
			if ( tcArray.length > records && fanArray.length > records && spArray.length > records)
			{
				tcArray.shift();
				fanArray.shift();
				spArray.shift();
			}

		}
		function updateChart(){
			chart.render();
		}
		function precise_round(num,decimals) {
			return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
		}
		init();
});