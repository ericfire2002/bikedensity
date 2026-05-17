// Import Mapbox as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// Check that Mapbox GL JS is loaded
console.log('Mapbox GL JS Loaded:', mapboxgl);

mapboxgl.accessToken = 'pk.eyJ1IjoiZXJpY2ZpcmUyMDAyIiwiYSI6ImNtcDh6Zm5zbzBhZzUyc24xMjU5Y2EybjUifQ.eoFRxS8B7b1esdFM-V099A';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-71.09415, 42.36027],
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
});

const bikeLaneStyle = {
  'line-color': '#32D400',
  'line-width': 5,
  'line-opacity': 0.6,
};

// function getCoords(station) {
//   const point = new mapboxgl.LngLat(+station.lon, +station.lat);
//   const { x, y } = map.project(point);
//   return { cx: x, cy: y };
// }

function getCoords(station) {
//   const lng = +(station.lon ?? station.Long);
//   const lat = +(station.lat ?? station.Lat);
    const lng = Number(
    station.lon ??
    station.Long ??
    station.longitude ??
    station.Longitude
  );

  const lat = Number(
    station.lat ??
    station.Lat ??
    station.latitude ??
    station.Latitude
  );

  const point = new mapboxgl.LngLat(lng, lat);
  const { x, y } = map.project(point);

  return { cx: x, cy: y };
}

map.on('load', async () => {
  console.log('Map loaded successfully');

  map.addSource('boston_route', {
    type: 'geojson',
    data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson',
  });

  map.addLayer({
    id: 'bike-lanes',
    type: 'line',
    source: 'boston_route',
    paint: bikeLaneStyle,
  });
  
  map.addSource('cambridge_route', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson',
  });

  map.addLayer({
    id: 'cambridge-bike-lanes',
    type: 'line',
    source: 'cambridge_route',
    paint: bikeLaneStyle,
});

const svg = d3.select('#map').select('svg');

  try {
    const stationUrl =
      'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    const trafficUrl =
      'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';

    const jsonData = await d3.json(stationUrl);
    const trips = await d3.csv(trafficUrl);

    let stations = jsonData.data.stations;

    const departures = d3.rollup(
      trips,
      (v) => v.length,
      (d) => d.start_station_id
    );

    const arrivals = d3.rollup(
      trips,
      (v) => v.length,
      (d) => d.end_station_id
    );

    stations = stations.map((station) => {
      const id = station.short_name;

      station.departures = departures.get(id) ?? 0;
      station.arrivals = arrivals.get(id) ?? 0;
      station.totalTraffic = station.departures + station.arrivals;

      return station;
    });

    console.log('Stations with traffic:', stations);

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(stations, (d) => d.totalTraffic)])
      .range([0, 25]);

    const circles = svg
      .selectAll('circle')
      .data(stations)
      .enter()
      .append('circle')
      .attr('r', (d) => radiusScale(d.totalTraffic))
      .attr('fill', 'steelblue')
      .attr('fill-opacity', 0.6)
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .each(function (d) {
        d3.select(this)
          .append('title')
          .text(
            `${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`
          );
      });

    function updatePositions() {
      circles
        .attr('cx', (d) => getCoords(d).cx)
        .attr('cy', (d) => getCoords(d).cy);
    }

    updatePositions();

    map.on('move', updatePositions);
    map.on('zoom', updatePositions);
    map.on('resize', updatePositions);
    map.on('moveend', updatePositions);
  } catch (error) {
    console.error('Error loading stations or traffic:', error);
  }
});

map.on('error', (e) => {
  console.error('Mapbox error:', e);
});







    // const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    // const jsonData = await d3.json(jsonurl);

    // console.log('Loaded JSON Data:', jsonData);

    // const stations = jsonData.data.stations;
    // console.log('Stations Array:', stations);

//     const circles = svg
//       .selectAll('circle')
//       .data(stations)
//       .enter()
//       .append('circle')
//       .attr('r', 5)
//       .attr('fill', 'steelblue')
//       .attr('stroke', 'white')
//       .attr('stroke-width', 1)
//       .attr('opacity', 0.8);

//     function updatePositions() {
//       circles
//         .attr('cx', (d) => getCoords(d).cx)
//         .attr('cy', (d) => getCoords(d).cy);
//     }

//     updatePositions();

//     map.on('move', updatePositions);
//     map.on('zoom', updatePositions);
//     map.on('resize', updatePositions);
//     map.on('moveend', updatePositions);
//   } catch (error) {
//     console.error('Error loading stations:', error);
//   }


});

map.on('error', (e) => {
  console.error('Mapbox error:', e);
});