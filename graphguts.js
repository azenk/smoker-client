$(document).ready(function() {
	// Initialize arrays & variables
	var tcArray = [];
	var spArray = [];
	var fanArray = [];
	var fireArray = [];
	var foodArray = [];
	var food2Array = [];
	var damperArray = [];
	var coldArray = [];
	
	function asem(fireFunc,initLock){
        	if(initLock)
                	this.lock=initLock;
        	else
        				this.lock=0;
					this.func = fireFunc;
	}
 
	asem.prototype.v = function(){
		this.lock++;
	}
 
	asem.prototype.p = function(){
		this.lock--;
		if(this.lock==0 && this.func)
			this.func();
	}

	var foodSetArray = [];
	var foodBufferTemp;

	var records = 1;
	var cleaninterval = 60*60*1000;
	var updateinterval = 2.5;
	var slowUpdateInterval = 60.0;

	var bufferedKp;
	var bufferedKi;
	var bufferedKd;
	var loadtime = new Date();
	loadtime.setMinutes(loadtime.getMinutes() - 60);

	var chartLock = new asem(updateCharts);
	
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
			updatePID();
			updateBattery();
			
			setInterval(updatePID, slowUpdateInterval * 1000);
			setInterval(updateBattery, slowUpdateInterval * 1000);
			setInterval(updateArrays, updateinterval * 1000);
	}

	// helper function to create URLs for JSON calls
	function variableURL(variablename,a){
		var starttime;

		if (typeof a != "undefined" && a.length > 0){
			starttime = a[a.length - 1]['x'];
		} else {
			starttime = loadtime;
		}

		if (typeof a != "undefined"){
			return "https://smoker.culinaryapparatus.com/api/values/1/".concat(variablename) + "?start=" + formatRequestTime(starttime);
		} else {
			return "https://smoker.culinaryapparatus.com/api/values/1/".concat(variablename);
		}
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
			document.getElementById("batteryPercentage").setAttribute("style","width:" + battery_pct + "%");
			document.getElementById("batteryPercentage").style.width = battery_pct + " px";
		});
	}

	function zeroPaddedToString(num,digits){
		var resultString = ""
		for (var i = 1; i < digits; i++){
			if (num < Math.pow(10,i)){
				resultString = resultString + "0";
			}
		}
		return resultString + num.toString();
	}

	function formatRequestTime(time){
		var year = time.getFullYear().toString();
		var day = zeroPaddedToString(time.getDate(),2);
		var month = zeroPaddedToString(time.getMonth()+1,2);
		var hour = zeroPaddedToString(time.getHours(),2);
		var minute = zeroPaddedToString(time.getMinutes(),2);
		var second = zeroPaddedToString(time.getSeconds(),2);
		var mseconds = zeroPaddedToString(time.getMilliseconds(),3);

		return year + month + day + "-" + hour + ":" + minute + ":" + second + "." + mseconds;
	}

	function appendArray(a,result){
				for (var i = 0; i < result.length; i++){
					var val = result[i]["value"];
					timeStamp = new Date(result[i]["time"]);
					a.push({x: timeStamp, y: val});
				}
	}

	function valuebox(title,value){
				return "<div class=\"title\">" + title + "</div><div class=\"value\">" +  value + "</div>";
	}

	// Calls the JSON
	function updateArrays(){
	// Get current time
	var now = new Date();
	var timeStamp;
		$.getJSON("/api/user/info",function(result){
			if (result["logged_in"]){
				if (result["update"]){
					document.getElementById("parameterforms").style.display = "";
				} else {
					document.getElementById("parameterforms").style.display = "none";
				}
				document.getElementById("username").innerHTML = "Logged in as " + result["name"] + " (<a href=\"/api/logout\">logout</a>)";
			} else {
				document.getElementById("parameterforms").style.display = "none";
				document.getElementById("username").innerHTML = "<a href=\"/api/login\">Click here to login</a>";
			}
		});
		// Smoker temp
		chartLock.v();
		$.getJSON(variableURL("tctemp",tcArray),function(result){
				result = result["result"];
				appendArray(tcArray,result);
				var tctemp = tcArray[tcArray.length - 1]['y'];
				document.getElementById("tcTemp").innerHTML = valuebox("Smoker Temperature", precise_round(tctemp,2) + " &deg;C");
			chartLock.p();
		});

		// Fan output
		chartLock.v();
		$.getJSON(variableURL("output_pct",fanArray),function(result){
			appendArray(fanArray,result["result"]);
			chartLock.p();
		});

		// Temperature setpoint
		chartLock.v();
		$.getJSON(variableURL("setpoint",spArray),function(result){
			appendArray(spArray,result["result"]);
			var setpoint = spArray[spArray.length - 1]['y'];
			document.getElementById("setTemp").innerHTML = valuebox("Smoker Setpoint", setpoint + " &deg;C");
			chartLock.p();
		});
		
		// Firebox temperature
		chartLock.v();
		$.getJSON(variableURL("firetemp",fireArray),function(result){
			appendArray(fireArray,result["result"]);
			chartLock.p();
		});
		
		// Food temperatures
		chartLock.v();
		$.getJSON(variableURL("foodtemp1",foodArray),function(result){
			appendArray(foodArray,result["result"]);
				
			//Set temp is held in cache, no ajax call needed
			if (foodBufferTemp >= 0){
				foodSetArray.push({x: now, y: foodBufferTemp});
			}
			if (foodArray.length > 0) {
				var foodtemp1 = foodArray[foodArray.length - 1]['y'];
				document.getElementById("foodTemp").innerHTML = valuebox("Food 1", precise_round(foodtemp1,2) + " &deg;C");
			} else {
				document.getElementById("foodTemp").innerHTML = valuebox("Food 1",  "-- &deg;C");
			}
			chartLock.p();
		});
		chartLock.v();
		$.getJSON(variableURL("foodtemp2",food2Array),function(result){
			appendArray(food2Array,result["result"]);
			if (food2Array.length > 0) {
				var foodtemp2 = food2Array[food2Array.length - 1]['y'];
				document.getElementById("foodTemp2").innerHTML = valuebox( "Food 2" , precise_round(foodtemp2,2) + " &deg;C");
			} else {
				document.getElementById("foodTemp2").innerHTML = valuebox("Food 2", "-- &deg;C");
			}
			chartLock.p();
		});
		
		// Enclosure temperature
		chartLock.v();
		$.getJSON(variableURL("coldtemp",coldArray),function(result){
			appendArray(coldArray,result["result"]);
			var coldtemp = coldArray[coldArray.length - 1]['y'];
			document.getElementById("coldTemp").innerHTML = valuebox("Enclosure temp", precise_round(coldtemp,2) + " &deg;C");
			chartLock.p();
		});
		coldArray = [];
		
		// Damper setting
		chartLock.v();
		$.getJSON(variableURL("damper_pct_open",damperArray),function(result){
			appendArray(damperArray,result["result"]);
			chartLock.p();
		});
		
		//cleanup
		cleanArrays();
	}
	
	//cleanup function to prevent arrays from getting too big
	function cleanArrays(){
		var d = new Date();
		while (tcArray.length > 0 && (d - tcArray[0]["x"]) > cleaninterval)
		{
			tcArray.shift();
		}
		while (fanArray.length > 0 && (d - fanArray[0]["x"]) > cleaninterval)
		{
			fanArray.shift();
		}
		while (spArray.length > 0 && (d - spArray[0]["x"]) > cleaninterval)
		{
			spArray.shift();}
		while (fireArray.length > 0 && (d - fireArray[0]["x"]) > cleaninterval)
		{
			fireArray.shift();}
		while (foodArray.length > 0 && (d - foodArray[0]["x"]) > cleaninterval){
			foodArray.shift();}
		while (food2Array.length > 0 && (d - food2Array[0]["x"]) > cleaninterval){
			food2Array.shift();}
		while (foodSetArray.length > 0 && (d - foodSetArray[0]["x"]) > cleaninterval){
			foodSetArray.shift();}
		while (damperArray.length > 0 && (d-damperArray[0]["x"]) > cleaninterval){
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
