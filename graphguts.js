$(document).ready(function() {
	// Initialize arrays & variables
	var tcArray = [];
	var spArray = [];
	var fanArray = [];
	var fireArray = [];
	var foodArray = [];
	var food2Array = [];
	
	var foodSetArray = [];
	var foodBufferTemp;

	var records = 360;
	var updateinterval = 10.0;
	var slowUpdateInterval = 60.0;

	var bufferedKp;
	var bufferedKi;
	var bufferedKd;
	
	// Chart initialization
	var tempChart = new CanvasJS.Chart("tempChartContainer",{
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
			showInLegend: true,
			legendText: "Food Temp",
			dataPoints : foodArray
		},{
			type: "line",
			showInLegend: true,
			legendText: "Food Temp 2",
			dataPoints : food2Array
		},{
			type: "line",
			showInLegend: true,
			legendText: "Food Set Temp",
			dataPoints: foodSetArray
		}
		]
	  });
	  
	var fanChart = new CanvasJS.Chart("fanChartContainer",{
		title: {text: "Fan Output & Firebox Temperature"},
		axisX: {title: "Timestamp", titleFontSize: 20},
		axisY: {title: "Percent", suffix: " %"},
		axisY2: {title: "Temperature", suffix: " C"},
		legend: {verticalAlign: "bottom"},
		zoomEnabled: true,
		
		data: [{
			type: "line",
			showInLegend: true,
			dataPoints: fanArray,
			legendText: "Fan"
			},{
			type: "line",
			showInLegend: true,
			axisYType: "secondary",
			dataPoints: fireArray,
			legendText: "Firebox"
			}]
	});
	
	// Temperature setpoint submit
	$('#tempSubmit').click(function(e)
		{
			//prevent reloading of the page
			e.preventDefault();
			
			var temp = document.forms["setTempForm"]["args"].value;
			
			// only submit if the temperature is above 0 C
			if (parseFloat(temp) > 0 ){
				$.ajax({
					url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/newsetpoint",
					type:'POST',
					data:
					{
						access_token: '1451c88ec0c225eb59e8474d3b986c595ca3d111',
						args: temp
					},
					success: function()
					{
						alert('Temperature Updated To ' + temp + ' C');
						document.forms["setTempForm"]["args"].value = "";
					},
					error: function()
					{
						alert('Update failed');
					}
				});
			}
		});
		
	// PID parameter submit
	$('#pidSubmit').click(function(e)
		{
			//prevent reloading of the page
			e.preventDefault();
			
			var kp = document.forms["pidParmForm"]["kpArg"].value;
			var ki = document.forms["pidParmForm"]["kiArg"].value;
			var kd = document.forms["pidParmForm"]["kdArg"].value;
			
			// input values need to be comma seperated
			var temp = kp + "," + ki + "," + kd;
			
			$.ajax({
				url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/retune",
				type:'POST',
				data:
				{
					access_token: '1451c88ec0c225eb59e8474d3b986c595ca3d111',
					args: temp
				},
				success: function()
				{
					alert('Parameters have been updated');
				},
				fail: function()
				{
					alert('Update failed');
				}
			});
		});
	
	// Food setpoint submit
	$('#foodSubmit').click(function(e)
	{
		//prevent reloading of page
		e.preventDefault();
		
		var foodSetTemp = document.forms["foodTempForm"]["foodtemparg"].value;
		
		// only submit if the temperature is above 0 C
		if (parseFloat(foodSetTemp) > 0 ){
			foodBufferTemp = parseFloat(foodSetTemp);
		}
	});
	
	function init(){
			updateArrays();
			updateCharts();
			updatePID();
			
			setInterval(updatePID, slowUpdateInterval * 1000);
			setInterval(updateCharts, updateinterval * 1000);
			setInterval(updateArrays, updateinterval * 1000);
	}

	// helper function to create URLs for JSON calls
	function variableURL(variablename){
		var device = "48ff6b065067555023151787";
		var access_token = "1451c88ec0c225eb59e8474d3b986c595ca3d111";
		return "https://api.spark.io/v1/devices/".concat( device, "/", variablename, "?access_token=", access_token);
	}

	// Calls the JSON
	function updateArrays(){
		// Smoker temp
		$.getJSON(variableURL("tctemp"),function(result){
			var tctemp_pct = result["result"];
			if (tctemp_pct <= 500 && tctemp_pct >= 0) {
				tcArray.push({x: new Date(result["coreInfo"]["last_heard"]), y: tctemp_pct});
				document.getElementById("tcTemp").innerHTML = "Current smoker temp: " +  precise_round(tctemp_pct,2) + " &deg;C";
			}
		});

		// Fan output
		$.getJSON(variableURL("output"),function(result){
			var output_pct = result["result"]/255 * 100;
			if (output_pct <= 100 && output_pct >= 0){
				fanArray.push({x: new Date(result["coreInfo"]["last_heard"]), y: output_pct});
			}
		});

		// Temperature setpoint
		$.getJSON(variableURL("setpoint"),function(result){
			var setpoint_pct = result["result"];
			if (setpoint_pct <= 500 && setpoint_pct >= 0){
				spArray.push({x: new Date(result["coreInfo"]["last_heard"]), y: setpoint_pct});
				document.getElementById("setTemp").innerHTML = "Set temp: " + setpoint_pct + " &deg;C";
			}
		});
		
		// Firebox temperature
		$.getJSON(variableURL("firetemp"),function(result){
			var firetemp_pct = result["result"];
			fireArray.push({x: new Date(result["coreInfo"]["last_heard"]), y: firetemp_pct});
			});
		
		// Food temperatures
		$.getJSON(variableURL("foodtemp1"),function(result){
			var foodtemp1 = result["result"];
			if (foodtemp1 <= 500 && foodtemp1 >= 0){
				foodArray.push({x: new Date(result["coreInfo"]["last_heard"]), y: foodtemp1});
				document.getElementById("foodTemp").innerHTML = "Current food temp: " + precise_round(foodtemp1,2) + " &deg;C";
				
				//Set temp is held in cache, no ajax call needed
				if (foodBufferTemp >= 0){
					foodSetArray.push({x: new Date(result["coreInfo"]["last_heard"]), y: foodBufferTemp});
					}
			}
		});
		$.getJSON(variableURL("foodtemp2"),function(result){
			var foodtemp2 = result["result"];
			if (foodtemp2 <= 500 && foodtemp2 >= 0){
				food2Array.push({x: new Date(result["coreInfo"]["last_heard"]), y: foodtemp2});
				document.getElementById("foodTemp2").innerHTML = "Current food 2 temp: " + precise_round(foodtemp2,2) + " &deg;C";
			}
		});
		
		// Enclosure temperature
		$.getJSON(variableURL("coldtemp"),function(result){
			document.getElementById("coldTemp").innerHTML = "Enclosure temp: " + precise_round(result["result"],2) + " &deg;C";
		});
		
		//cleanup arrays so they don't get too big
		if ( tcArray.length > records && fanArray.length > records && spArray.length > records)
		{
			tcArray.shift();
			fanArray.shift();
			spArray.shift();
			fireArray.shift();
			foodArray.shift();
			food2Array.shift();
			foodSetArray.shift();
		}

	}
	

	//Update functions
	function updateCharts(){
		tempChart.render();
		fanChart.render();
	}
	
	function updatePID()
	{
		$.ajax({
			url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/kp?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
		}).then(function(data) {
			if (bufferedKp != data.result){
				bufferedKp = data.result;
				document.forms["pidParmForm"]["kpArg"].value = bufferedKp;
			}
		});

		$.ajax({
			url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/ki?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
		}).then(function(data) {
			if (bufferedKi != data.result){
				bufferedKi = data.result;
				document.forms["pidParmForm"]["kiArg"].value = bufferedKi;
			}
		});
		$.ajax({
			url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/kd?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
		}).then(function(data) {
			if (bufferedKd != data.result){
				bufferedKd = data.result;
				document.forms["pidParmForm"]["kdArg"].value = data.result;
		   }
		});
	}
	
	// Rounding function for the current temperature labels
	function precise_round(num,decimals) {
		return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
	}
	init();
});
