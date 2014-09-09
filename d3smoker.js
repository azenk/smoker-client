var tcArray = [];
var fireArray = [];

var updateinterval = 5.0;
var loadtime = new Date();
loadtime.setMinutes(loadtime.getMinutes() - 240);

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
	var chartLock = new asem(updateCharts);
	
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
	function precise_round(num,decimals) {
		return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
	};
	function appendArray(a,result){
				for (var i = 0; i < result.length; i++){
					var val = result[i]["value"];
					timeStamp = new Date(result[i]["time"]);
					a.push({date: timeStamp, temp: val});
				}
	};

	function formatRequestTime(time){
		var year = time.getFullYear().toString();
		var day = zeroPaddedToString(time.getDate(),2);
		var month = zeroPaddedToString(time.getMonth()+1,2);
		var hour = zeroPaddedToString(time.getHours(),2);
		var minute = zeroPaddedToString(time.getMinutes(),2);
		var second = zeroPaddedToString(time.getSeconds(),2);
		var mseconds = zeroPaddedToString(time.getMilliseconds(),3);

		return year + month + day + "-" + hour + ":" + minute + ":" + second + "." + mseconds;
	};
	function zeroPaddedToString(num,digits){
		var resultString = ""
		for (var i = 1; i < digits; i++){
			if (num < Math.pow(10,i)){
				resultString = resultString + "0";
			}
		}
		return resultString + num.toString();
	};
	// Calls the JSON
function updateArrays(){
	// Get current time
	var now = new Date();
	var timeStamp;
	
	// Smoker temp
	chartLock.v();
		$.getJSON(variableURL("tctemp",tcArray),function(result){
				result = result["result"];
				appendArray(tcArray,result);
	chartLock.p();				
		});
		// Firebox temperature
 		chartLock.v();
		$.getJSON(variableURL("firetemp",fireArray),function(result){
			appendArray(fireArray,result["result"]);
			chartLock.p();
		});
	};
	updateArrays();
function updateCharts(){
var margin = {top: 20, right: 50, bottom: 50, left: 50},
    width = 960 - margin.left - margin.right,
    height = 510 - margin.top - margin.bottom;

var parseDate = d3.time.format("%c").parse,
    bisectDate = d3.bisector(function(d) { return d.date; }).left,
    formatValue = d3.format(",.2f");

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);
var y2 = d3.scale.linear()
	.range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");
var y2Axis = d3.svg.axis()
	.scale(y2)
	.orient("right");
	
var line = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.temp); });
var fireLine = d3.svg.line()
	.x(function(d) {return x(d.date);})
	.y(function(d) {return y2(d.temp);});

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

tcArray.sort(function(a,b) {
return a.date - b.date;
});
fireArray.sort(function(a,b) {
return a.date - b.date;
});
var fireMin = Math.min.apply(Math,fireArray.map(function(o){return o.temp;})),
	fireMax = Math.max.apply(Math,fireArray.map(function(o){return o.temp;})),
	tcMin = Math.min.apply(Math,tcArray.map(function(o){return o.temp;})),
	tcMax = Math.max.apply(Math,tcArray.map(function(o){return o.temp;}))
	
   x.domain([tcArray[0].date, tcArray[tcArray.length - 1].date]); 
	/* y.domain([Math.min(fireMin,tcMin),Math.max(fireMax,tcMax)]); */
	y.domain(d3.extent(tcArray, function(d) {return d.temp}));
	y2.domain(d3.extent(fireArray,function(d) {return d.temp}));

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
	.append("text")
		.attr("x", 450)
		.attr("dy", "3em")
		.style("text-anchor","middle")
		.text("Timestamp");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Smoker Temperature (C)");
	  
  svg.append("g")
		.attr("class", "y axis")
		.attr("transform","translate("+width+",0)")
		.call(y2Axis)
	.append("text")
		.attr("transform","rotate(-90)")
		.attr("y",6)
		.attr("dy", "-1em")
		.style("text-anchor","end")
		.text("Firebox Temperature (C)");

  svg.append("path")
      .datum(tcArray)
      .attr("class", "line")
      .attr("d", line);
	svg.append("path")
		.datum(fireArray)
		.attr("class","line")
		.style("stroke","red")
		.attr("d", fireLine);
		
  var focus = svg.append("g")
      .attr("class", "focus")
      .style("display", "none");

  focus.append("circle")
      .attr("r", 4.5);

  focus.append("text")
      .attr("x", 9)
      .attr("dy", ".35em");

	var fireFocus = svg.append("g")
		.attr("class", "fireFocus")
		.style("display", "none");
	fireFocus.append("circle")
		.attr("r",4.5)
		.style("stroke","red")
		.style("fill","none");
	fireFocus.append("text")
		.attr("x", 9)
		.attr("dy", ".35em");
		
	var legend = svg.append("g")
		.attr("class","legend")
	legend.append("rect")
		.attr("x", 5)
		.attr("y", 470)
		.attr("height",10)
		.attr("width",10)
		.style("stroke","blue")
		.style("fill","blue");
	legend.append("text")
		.attr("x",17)
		.attr("y",480)
		.style("fill","black")
		.text("Smoker Temp");
	legend.append("rect")
		.attr("x", 85)
		.attr("y", 470)
		.attr("height",10)
		.attr("width",10)
		.style("stroke","red")
		.style("fill","red");
	legend.append("text")
		.attr("x",97)
		.attr("y",480)
		.style("fill","black")
		.text("Firebox Temp");
		
  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function() { focus.style("display", null); fireFocus.style("display",null); })
      .on("mouseout", function() { focus.style("display", "none"); fireFocus.style("display","none"); })
      .on("mousemove", mousemove);

  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]),
        i = bisectDate(tcArray, x0, 1),
		j = bisectDate(fireArray,x0,1),
        d0 = tcArray[i - 1],
		e0 = fireArray[j - 1],
        d1 = tcArray[i],
		e1 = fireArray[j],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0,
		e = x0 - e0.date > e1.date - x0 ? e1 : e0;
    focus.attr("transform", "translate(" + x(d.date) + "," + y(d.temp) + ")");
    focus.select("text").text(d.temp + " C");
    fireFocus.attr("transform", "translate(" + x(e.date) + "," + y2(e.temp) + ")");
    fireFocus.select("text").text(e.temp + " C");
	}
  };