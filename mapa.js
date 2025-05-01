const map = L.map('map').setView([-23.55, -46.63], 8); // Ponto inicial (SP)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const overlayMaps = {};
const allBounds = []; // Para armazenar os bounds de cada camada

// Controle de camadas
const layersControl = L.control.layers(null, overlayMaps).addTo(map);

// Função para adicionar legenda ao mapa
function addLegend() {
  const legend = L.control({ position: 'bottomleft' });

  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');
    const colors = ['blue', 'green']; // As cores das camadas
    const labels = ['Áreas Contaminadas CETESB', 'Municípios de SP']; // Labels das camadas

    // Adiciona cada item da legenda
    for (let i = 0; i < labels.length; i++) {
      div.innerHTML +=
        '<i style="background:' + colors[i] + '"></i> ' +
        labels[i] + '<br>';
    }
    return div;
  };

  legend.addTo(map);
}

// Função para adicionar camada Shapefile
function addShapefileLayer(name, url, styleOptions, camposDesejados) {
  fetch(url)
    .then(res => res.arrayBuffer())
    .then(buffer => shp(buffer))
    .then(geojson => {
      const layer = L.geoJSON(geojson, {
        style: styleOptions,
        onEachFeature: function (feature, lyr) {
          const props = feature.properties;
          let popupContent = "<h4>Detalhes</h4>";
          
          // Filtra e exibe apenas as propriedades desejadas
          camposDesejados.forEach(key => {
            if (props[key]) {
              popupContent += `<b>${key}</b>: ${props[key]}<br>`;
            }
          });

          // Se não houver informações, exibe mensagem padrão
          lyr.bindPopup(popupContent || "Sem informações disponíveis.");
        }
      });

      overlayMaps[name] = layer;
      layer.addTo(map);
      layersControl.addOverlay(layer, name);

      // Adiciona bounds ao conjunto e ajusta visualização
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        allBounds.push(bounds);
        const combined = allBounds.reduce((a, b) => a.extend(b));
        map.fitBounds(combined); // Ajusta a visualização para mostrar todas as camadas
      }
    })
    .catch(err => console.error(`Erro ao carregar ${url}:`, err));
}

// Adiciona as camadas com informações desejadas
addShapefileLayer('Áreas Contaminadas CETESB', 'assets/mapas/AREA_CONTAMINADA_CETESB_2020.zip', {
  color: 'blue',
  weight: 2,
  fillOpacity: 0.4
}, ["Razao_soci", "Endereco", "Numero", "Atividade", "Classifica"]);

addShapefileLayer('Municípios de SP', 'assets/mapas/SP_Municipios_2024.zip', {
  color: 'green',
  weight: 1,
  fillOpacity: 0.1
}, ["NM_MUN", "SIGLA_UF", "AREA_KM2"]);

// Adiciona a legenda ao mapa
addLegend();
