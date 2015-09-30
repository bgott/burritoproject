var map;
var service;
var infowindow;
var user_location;
var places = {};
var directionsDisplay;
var directionsService;
var DEFAULT_ZOOM = 14;
var DEFAULT_RADIUS = '500';
var stylesArray = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#000000"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"weight":"4"}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"on"},{"saturation":"-100"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":20},{"visibility":"on"}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"administrative.locality","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"administrative.neighborhood","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"administrative.land_parcel","elementType":"all","stylers":[{"visibility":"on"},{"lightness":"80"}]},{"featureType":"landscape","elementType":"all","stylers":[{"visibility":"simplified"},{"color":"#797979"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":20}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"landscape.natural.landcover","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"landscape.natural.terrain","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#dfdfdf"},{"lightness":21},{"visibility":"on"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#fed41c"},{"visibility":"on"},{"weight":"3.00"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#fed41c"},{"gamma":"0.6"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry","stylers":[{"visibility":"on"},{"color":"#fed41c"},{"weight":"4.00"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry.stroke","stylers":[{"weight":"1"},{"gamma":"0.6"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#b8b8b8"},{"lightness":18},{"visibility":"on"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#b6b6b6"}]},{"featureType":"road.local","elementType":"all","stylers":[{"visibility":"on"},{"color":"#656565"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#cdcdcd"},{"lightness":16}]},{"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"color":"#b6b6b6"},{"visibility":"on"}]},{"featureType":"road.local","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#c5c5c5"},{"lightness":19},{"visibility":"on"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#c0d8e3"},{"lightness":17},{"visibility":"on"}]}];

$('#map').load(function() {
  $('.burrito-div').fadeOut('slow');
});

/** fetch the user's location from the browser, display appropriate error 
 *    if the location is unavailable
 */
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setLocation, userLocationError);
  } else {
    window.alert('User denied access to geolocation');
  }
}

function setLocation(position) {
  var latlng = {lat: position.coords.latitude, lng: position.coords.longitude};
  user_location = latlng;

  initMap();
  setTimeout(showUserPosition, 2000);
  setTimeout(burritoSearch, 2000);
}


/** makes use of googlemaps api's call to nearbySearch
 *  which allows to sort by distance from the user's location.
 *  there seem to be a few discrepancies between the call's
 *  results, and the distance estimates of the google maps
 *  directions class, but it's pretty damn accurate.
 */
function burritoSearch() {
  service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: user_location,
//    radius: DEFAULT_RADIUS,
    keyword: 'burrito',
    types: ['restaurants'],
    rankBy: google.maps.places.RankBy.DISTANCE,
  }, searchcallback);
}

function userLocationError(error) {
  switch(error.code) {
    case error.PERMISSION_DENIED:
        window.alert("User denied the request for Geolocation.");
        break;
    case error.POSITION_UNAVAILABLE:
        window.alert("Location information is unavailable.");
        break;
    case error.TIMEOUT:
        window.alert("The request to get user location timed out.");
        break;
    case error.UNKNOWN_ERROR:
        window.alert("An unknown error occurred.");
        break;
    }
}


/** display the user's position icon
 *    and display the user's infowindow
 */
function showUserPosition() {
  map.panTo(user_location);
  map.setZoom(DEFAULT_ZOOM);

  var myIcon = new google.maps.MarkerImage("./images/location_marker.png", null, null, null, new google.maps.Size(17,17));
  var marker = new google.maps.Marker({
    position: user_location,
    map: map,
    title: 'You are here',
    icon: myIcon,
  });

  infowindow.setContent(marker.title);
  infowindow.open(map, marker);
    
  google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map, this);
  });
}

/** after the route is calculated and displayed on the map, we move
 *    the route directions <div> underneath the matching place button
 */
function calculateAndDisplayRoute(directionsService, directionsDisplay, destination) {
  var start = user_location;
  var end = destination.vicinity;
  directionsDisplay.setMap(map);
  directionsService.route({
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.DRIVING,
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
      var button = $(document).find('.list-group').children('.active');
      $('#right-panel').insertAfter(button);
      $('#right-panel').show();
      setTimeout(adjustMap, 5);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}

/** by covering part of the map with the 
 *  panel of burrito places, as well as the
 *  banner, we've covered part of the map
 *  that the google API thinks is in use.
 *  this function adjusts the map to display
 *  the directions within the usable section
 *  of the map
 */
function adjustMap() {
  map.setZoom(map.getZoom() - 1);
  map.panBy(-170, -100);
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: user_location,
    zoom: DEFAULT_ZOOM,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    streetViewControl: false,
    styles: stylesArray,
  });

  directionsDisplay = new google.maps.DirectionsRenderer;
  directionsService = new google.maps.DirectionsService;
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById('right-panel'));

  infowindow = new google.maps.InfoWindow();
  $('#map').removeClass('map-loading');
}

function searchcallback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    var destinations = [];
    var user_locations = [];
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
      addPlaceToList(results[i]);
    }
  }
  fadeGif();
}

function fadeGif() {
  $('#burrito-gif').addClass('burrito-gif-fade');
  setTimeout(function() {
    $('.burrito-div').remove();
  }, 200);
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var myIcon = new google.maps.MarkerImage("./images/burrito_marker2.png", null, null, null, new google.maps.Size(70, 70));
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    animation: google.maps.Animation.DROP,
    icon: myIcon,
    zIndex: 2,
  });

  // service = new google.maps.places.PlacesService(map);
  // service.getDetails(place, callback);

  google.maps.event.addListener(marker, 'click', function() {
    createMarkerInfobox(marker, place);
    var previous = $(".list-group").children(".active");
    previous.removeClass('active'); 
    $("button:contains('" + place.vicinity + "')").addClass('active');
    calculateAndDisplayRoute(directionsService, directionsDisplay, place);
    scrollToPlaceList();
  });

  marker.setMap(map);

  $('#map').data(place.name, marker);
  $('.places').data(place.name, place);
}

function createMarkerInfobox(marker, place) {
  var contentStr = '<h4>' + place.name + '</h4><p>' + place.vicinity;
    contentStr += '</p>';
      
    infowindow.setContent(contentStr);
    infowindow.open(map, marker);
}


/** create the list-group-item button and descendants for each place
 *    and append it to the list-group in the panel
 */
function addPlaceToList(place) {

  var list_str ="";
  list_str += "<button type='button' class='list-group-item place-button'>";
  list_str += "<h4 class='list-group-item-heading'>" + place.name + "</h4>";
  list_str += "<p class='list-group-item-text address' hidden>" + place.vicinity + "</p>";
  list_str += "<div class='star-ratings-css'><div class='star-ratings-css-top'style='width: " + (place.rating * 25) + "%'><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div><div class='star-rating-css-bottom'><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div></div>";
  list_str += "<div class='price'>";
  for (var i = 0; i < place.price_level; i++) {
    list_str += "$";
  }
  if (place.price_level == undefined) {
    list_str += '?';
  }
  list_str += "</div>";
  list_str += "</button>";

  $('.list-group').append(list_str);
}

$(document).on('click', '.place-button', function() {
  var previous = $('.active');
  // remove all appropriate styling from the previously selected place
  if (previous) {
    previous.removeClass('active');
    previous.children('.address').hide();
    //$(this).children('.price').removeClass('price-active');
    $('#right-panel').hide();
    directionsDisplay.setMap(null);
  }
  var address = $(this).children('.address').text();
  var prev_addr = previous.children('.address').text();

  // clicked a new place button
  if (address !== prev_addr) {
    $(this).addClass('active');
    $(this).children('.address').show();
    //$(this).children('.price').addClass('price-active');

    var name = $(this).children('h4').text();
    var marker = $('#map').data(name);
    var place = $('.places').data(name);
    createMarkerInfobox(marker, place);
    calculateAndDisplayRoute(directionsService, directionsDisplay, place);
    setTimeout(scrollToPlaceList, 200);

  } else {
    map.panTo(user_location);
    map.setZoom(DEFAULT_ZOOM);
    infowindow.close();
  }

});

/** scrolls along the list of 
 *  places, to the active burrito shop.
 *  we set a timeout to reduce lag
 *  between the auto zoom after directions
 *  are displayed.
 */
function scrollToPlaceList() {
  var groupdiv = $('.list-group');
  var scrollto = $('.active');
  groupdiv.animate({
    scrollTop: scrollto.offset().top - groupdiv.offset().top + groupdiv.scrollTop()
  });
}


