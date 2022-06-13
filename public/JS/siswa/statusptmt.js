$(document).ready(function() {
    $('#country-dropdown').on('change', function() {
    var country_id = this.value;
    $("#state-dropdown").html('');
    $.ajax({
    url: "http://localhost:8080/get-states-by-country",
    type: "POST",
    data: {
    name: 'country',
    country_id: country_id,
    },
    dataType: 'json',
    success: function(result) {
    $('#state-dropdown').html('<option value="">Select State</option>');
    $.each(result.states, function(key, value) {
    $("#state-dropdown").append('<option value="' + value.id + '">' + value.name + '</option>');
    });
    $('#city-dropdown').html('<option value="">Select State First</option>');
    }
    });
    });
    $('#state-dropdown').on('change', function() {
    var state_id = this.value;
    $("#city-dropdown").html('');
    $.ajax({
    url: "http://localhost:8080/get-cities-by-state",
    type: "POST",
    data: {
    name: 'state',
    state_id: state_id,
    },
    dataType: 'json',
    success: function(result) {
    $('#city-dropdown').html('<option value="">Select City</option>');
    $.each(result.cities, function(key, value) {
    $("#city-dropdown").append('<option value="' + value.id + '">' + value.name + '</option>');
    });
    }
    });
    });
    }); 
    
    function showHide() {
        let travelhistory = document.getElementById('country-dropdown')
        if (travelhistory.value == 0) {
            document.getElementById('ptmt').style.display = 'block'
        } else if (travelhistory.value == 1) {
            document.getElementById('ptmt').style.display = 'block'
        } else {
            document.getElementById('ptmt').style.display = 'none'
        }
    }