$(document).ready(function() {
    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/output?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.pid-output').append(data.result);
    });

    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/coldtemp?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.ambient-temp').append(data.result);
    });

    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/tctemp?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.smoker-temp').append(data.result);
    });

    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/pidoutput?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.pid-output-raw').append(data.result);
    });

    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/pidintegral?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.pid-i').append(data.result);
    });

    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/piddiff?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.pid-d').append(data.result);
    });

    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/kp?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.pid-kp').append(data.result);
    });

    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/ki?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.pid-ki').append(data.result);
    });
    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/kd?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.pid-kd').append(data.result);
    });
    $.ajax({
        url: "https://api.spark.io/v1/devices/48ff6b065067555023151787/setpoint?access_token=1451c88ec0c225eb59e8474d3b986c595ca3d111"
    }).then(function(data) {
       $('.pid-sp').append(data.result);
    });
});
