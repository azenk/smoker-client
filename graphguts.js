$(document).ready(function() {
	// Initialize arrays & variables
	var tcArray = [];
	var spArray = [];
	var fanArray = [];
	var fireArray = [];
	var foodArray = [];
	var food2Array = [];
	var damperArray = [];
	
	var foodSetArray = [];
	var foodBufferTemp;

	var records = 1;
	var cleaninterval = 1800000;
	var updateinterval = 5.0;
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
		title: {text: "Fan Output, Damper, & Firebox Temperature"},
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
			},{
			type: "line",
			showInLegend: true,
			dataPoints: damperArray,
			legendText: "Damper"
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
					url: "https://smoker.culinaryapparatus.com/api/smoker/1/parameters/setpoint",
					type:'POST',
					data:
					{
						value: temp
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
			var update_success = true;
			var returncount = 0;
			
			$.ajax({
				url: "https://smoker.culinaryapparatus.com/api/smoker/1/parameters/kp",
				type:'POST',
				data:
				{
					value: kp
				},
				success: function()
				{	
					update_success = update_success && true;
					returncount++;
					if (returncount == 3 && update_success){
						alert('PID parameters updated');
					}
				},
				fail: function()
				{
					update_success = false;
					returncount++;
					alert('Update failed kp');
				}
			});
			$.ajax({
				url: "https://smoker.culinaryapparatus.com/api/smoker/1/parameters/ki",
				type:'POST',
				data:
				{
					value: ki 
				},
				success: function()
				{	
					update_success = update_success && true;
					returncount++;
					if (returncount == 3 && update_success){
						alert('PID parameters updated');
					}
				},
				fail: function()
				{
					update_success = false;
					returncount++;
					alert('Update failed ki');
				}
			});
			$.ajax({
				url: "https://smoker.culinaryapparatus.com/api/smoker/1/parameters/kd",
				type:'POST',
				data:
				{
					value: kd 
				},
				success: function()
				{	
					update_success = update_success && true;
					returncount++;
					if (returncount == 3 && update_success){
						alert('PID parameters updated');
					}
				},
				fail: function()
				{
					update_success = false;
					returncount++;
					alert('Update failed kd');
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
			updateBattery();
			
			setInterval(updatePID, slowUpdateInterval * 1000);
			setInterval(updateBattery, slowUpdateInterval * 1000);
			setInterval(updateCharts, updateinterval * 1000);
			setInterval(updateArrays, updateinterval * 1000);
	}

	// helper function to create URLs for JSON calls
	function variableURL(variablename){
		//var device = "48ff6b065067555023151787";
		//var access_token = "1451c88ec0c225eb59e8474d3b986c595ca3d111";
		//return "https://api.spark.io/v1/devices/".concat( device, "/", variablename, "?access_token=", access_token);
		return "https://smoker.culinaryapparatus.com/api/values/1/".concat(variablename);
	}
	function variableSmokerURL(variablename)
	{
		return "https://smoker.culinaryapparatus.com/api/smoker/1/".concat(variablename);
	}
	// Battery updates
	function updateBattery()
	{
		$.getJSON(variableSmokerURL("power/batterycharge"),function(result){
			var battery_pct = result["value"];
			document.getElementById("batteryPercentage").setAttribute("style","width:" + battery_pct + "px");
			document.getElementById("batteryPercentage").style.width = battery_pct + " px";
		});
	}

	// Calls the JSON
	function updateArrays(){
	// Get current time
	var now = new Date();
	var timeStamp;
		// Smoker temp
		$.getJSON(variableURL("tctemp"),function(result){
			var tctemp_pct = result["value"];
			timeStamp = new Date(result["time"]);
			if (tctemp_pct <= 500 && tctemp_pct >= 0 && (Math.abs(timeStamp - now) < (updateinterval * 10000))) {
				tcArray.push({x: timeStamp, y: tctemp_pct});
				document.getElementById("tcTemp").innerHTML = "Current smoker temp: " +  precise_round(tctemp_pct,2) + " &deg;C";
			}
		});

		// Fan output
		$.getJSON(variableURL("output_pct"),function(result){
			var output_pct = result["value"];
			timeStamp = new Date(result["time"]);
			if (output_pct <= 100 && output_pct >= 0 && (Math.abs(timeStamp - now) < (updateinterval * 10000))){
				fanArray.push({x: timeStamp, y: output_pct});
			}
		});

		// Temperature setpoint
		$.getJSON(variableURL("setpoint"),function(result){
			var setpoint_pct = result["value"];
			var timeStamp = new Date(result["time"]);
			if (setpoint_pct <= 500 && setpoint_pct >= 0 && (Math.abs(timeStamp - now) < (updateinterval * 10000))){
				spArray.push({x: timeStamp, y: setpoint_pct});
				document.getElementById("setTemp").innerHTML = "Set temp: " + setpoint_pct + " &deg;C";
			}
		});
		
		// Firebox temperature
		$.getJSON(variableURL("firetemp"),function(result){
			var firetemp_pct = result["value"];
			timeStamp = new Date(result["time"]);
			if (Math.abs(timeStamp - now) < (updateinterval * 10000)){
			fireArray.push({x: timeStamp, y: firetemp_pct});}
			});
		
		// Food temperatures
		$.getJSON(variableURL("foodtemp1"),function(result){
			var foodtemp1 = result["value"];
			timeStamp = new Date(result["time"]);
			if (foodtemp1 <= 500 && foodtemp1 >= 0 && (Math.abs(timeStamp - now) < (updateinterval * 10000))){
				foodArray.push({x: timeStamp, y: foodtemp1});
				document.getElementById("foodTemp").innerHTML = "Current food temp: " + precise_round(foodtemp1,2) + " &deg;C";
				
				//Set temp is held in cache, no ajax call needed
				if (foodBufferTemp >= 0){
					foodSetArray.push({x: timeStamp, y: foodBufferTemp});
					}
			}
		});
		$.getJSON(variableURL("foodtemp2"),function(result){
			var foodtemp2 = result["value"];
			var timeStamp = new Date(result["time"]);
			if (foodtemp2 <= 500 && foodtemp2 >= 0 && (Math.abs(timeStamp - now) < (updateinterval * 10000))){
				food2Array.push({x: timeStamp, y: foodtemp2});
				document.getElementById("foodTemp2").innerHTML = "Current food 2 temp: " + precise_round(foodtemp2,2) + " &deg;C";
			}
		});
		
		// Enclosure temperature
		$.getJSON(variableURL("coldtemp"),function(result){
			document.getElementById("coldTemp").innerHTML = "Enclosure temp: " + precise_round(result["value"],2) + " &deg;C";
		});
		
		// Damper setting
		$.getJSON(variableURL("damper_pct_open"),function(result){
			var damper_pct = result["value"];
			var timeStamp = new Date(result["time"]);
			if (Math.abs(timeStamp - now) < (updateinterval * 10000)){
			damperArray.push({x: timeStamp, y: damper_pct});}
			});
		
		//cleanup
		cleanArrays();
	}
	
	//cleanup function to prevent arrays from getting too big
	function cleanArrays(){
		var d = new Date();
		if (tcArray.length > records && (d - tcArray[0]["x"]) > cleaninterval)
		{
			tcArray.shift();
		}
		if (fanArray.length > records && (d - fanArray[0]["x"]) > cleaninterval)
		{
			fanArray.shift();
		}
		if (spArray.length > records && (d - spArray[0]["x"]) > cleaninterval)
		{
			spArray.shift();}
		if (fireArray.length > records && (d - fireArray[0]["x"]) > cleaninterval)
		{
			fireArray.shift();}
		if (foodArray.length > records && (d - foodArray[0]["x"]) > cleaninterval){
			foodArray.shift();}
		if (food2Array.length > records && (d - food2Array[0]["x"]) > cleaninterval){
			food2Array.shift();}
		if (foodSetArray.length > records && (d - foodSetArray[0]["x"]) > cleaninterval){
			foodSetArray.shift();}
		if (damperArray.length > records && (d-damperArray[0]["x"]) > cleaninterval){
			damperArray.shift();}
		
	}

	//Update functions
	function updateCharts(){
		tempChart.render();
		fanChart.render();
	}
	
	function updatePID()
	{
		$.ajax({
			url: variableURL("kp")
		}).then(function(data) {
			if (bufferedKp != data.value){
				bufferedKp = data.value;
				document.forms["pidParmForm"]["kpArg"].value = bufferedKp;
			}
		});

		$.ajax({
			url: variableURL("ki")
		}).then(function(data) {
			if (bufferedKi != data.value){
				bufferedKi = data.value;
				document.forms["pidParmForm"]["kiArg"].value = bufferedKi;
			}
		});
		$.ajax({
			url: variableURL("kd")
		}).then(function(data) {
			if (bufferedKd != data.value){
				bufferedKd = data.value;
				document.forms["pidParmForm"]["kdArg"].value = bufferedKd;
		   }
		});
	}
	
	// Rounding function for the current temperature labels
	function precise_round(num,decimals) {
		return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
	}
	init();
});
