async function loadInteractiveMap(locations) {
    if (typeof L === 'undefined' || L === null) {
        console.error("Leaflet library (L) not loaded. Map cannot be initialized.");
        throw new Error("Leaflet library (L) not loaded.");
    }

    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("Map element with ID 'map' not found.");
        throw new Error("Map element with ID 'map' not found.");
    }

    // Clear previous map instance if it exists, to avoid Leaflet error if re-initializing on the same div
    // A more robust solution might involve storing the map instance globally and calling map.remove()
    if (mapElement._leaflet_id) {
        // This is a crude way to allow re-initialization; proper map instance management is better.
        // For this example, we'll assume Leaflet handles re-binding to the div or this is the first init.
    }

    const map = L.map("map").setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    // 📍 Custom pin icon
    const customIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    if (!locations || locations.length === 0) {
        console.warn("No locations provided to display on the map.");
        mapElement.style.display = 'none'; // Hide map if no locations
        return; // Resolve promise as there's nothing to load
    }
    mapElement.style.display = 'block'; // Ensure map is visible

    const bounds = [];
    const markerPromises = locations.map(location => {
      return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location.city)}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Nominatim API error: ${res.status} ${res.statusText} for ${location.city}`);
          }
          return res.json();
        })
        .then(data => {
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const latLng = [parseFloat(lat), parseFloat(lon)];
  
            // 🧠 Rich content from Gemini
            const popupContent = `
              <b>${location.city}</b><br>
              <strong>Why:</strong> ${location.reason}<br>
              <strong>Industries:</strong> ${(location.top_industries && location.top_industries.join(', ')) || 'N/A'}<br>
              <strong>Avg Salary:</strong> ${location.average_salary ? `$${location.average_salary.toLocaleString()} / year` : 'N/A'}<br>
              <strong>Top Employers:</strong> ${(location.top_employers && location.top_employers.join(', ')) || 'N/A'}
            `;
  
            const marker = L.marker(latLng, { icon: customIcon }).addTo(map);
            marker.bindPopup(popupContent);
            bounds.push(latLng);
          } else {
            console.warn(`Could not find coordinates for ${location.city}`);
          }
        })
        .catch(error => {
          console.error(`Error fetching or processing location ${location.city}:`, error);
          // Decide if one error should stop all map loading or just skip this marker
          // For Promise.all, an error in one promise rejects all.
          // To allow partial success, catch here and resolve (e.g., return null or an error object).
          // For this example, we'll let it propagate to Promise.all.
        });
    });

    await Promise.all(markerPromises);

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (locations.length > 0) {
      console.warn("No locations could be successfully plotted on the map.");
      // Default view is already set, or you could hide the map.
    }
}