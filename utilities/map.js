document.addEventListener("DOMContentLoaded", function () {
    const database = supabase.createClient('https://svdtdtpqscizmxlcicox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZHRkdHBxc2Npem14bGNpY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2NTU2ODEsImV4cCI6MjAzMjIzMTY4MX0.9Hkev2jhj11Q6r6DXrf2gpixaVTDj2vODRYwpxB5Y50');
    const map = L.map('map').setView([37.7749, -122.4194], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Obtener referencias a los elementos DOM
    const routeList = document.getElementById('routeTag');
    const vehicleList = document.getElementById('vehicleTag');

    // Inicializar variables para guardar las selecciones y la agencia
    let selectedRouteTag = null;
    let selectedVehicleId = null;
    let markers = {};
    let agencyTag = null;
    let lastTime = 0;
    let fetchInterval = null;
    let tableCounter = 0;

    // Función para obtener la lista de agencias y rutas
    async function getAgencyAndRouteList() {
        try {
            const response = await fetch('https://retro.umoiq.com/service/publicXMLFeed?command=agencyList');
            const data = await response.text();
            const xmlDoc = new DOMParser().parseFromString(data, "text/xml");
            agencyTag = xmlDoc.getElementsByTagName('agency')[6].getAttribute('tag');
            // Escoje el 0, 27, 6, quizas 1

            const routeListResponse = await fetch(`https://retro.umoiq.com/service/publicXMLFeed?command=routeList&a=${agencyTag}`);
            const routeListData = await routeListResponse.text();
            const routeXmlDoc = new DOMParser().parseFromString(routeListData, "text/xml");
            const routes = routeXmlDoc.getElementsByTagName('route');

            let routeListToHTML = '';
            for (let i = 0; i < routes.length; i++) {
                const routeTag = routes[i].getAttribute('tag');
                const routeTitle = routes[i].getAttribute('title');
                routeListToHTML += `<option value="${routeTag}">${routeTitle}</option>`;
            }

            return { routeListToHTML };
        } catch (error) {
            console.error('Error fetching agency and route list:', error);
            return { routeListToHTML: '' };
        }
    }

    async function fetchVehicleLocations() {
        const vehicleLocationUrl = `https://retro.umoiq.com/service/publicXMLFeed?command=vehicleLocations&a=${agencyTag}&r=${selectedRouteTag}&t=${lastTime}`;
        const response = await fetch(vehicleLocationUrl);
        const data = await response.text();
        const xmlDoc = new DOMParser().parseFromString(data, "text/xml");

        const vehicles = xmlDoc.getElementsByTagName('vehicle');
        let vehicleListToHTML = '<option value="">Select Vehicle...</option>';
        for (let i = 0; i < vehicles.length; i++) {
            const vehicle = vehicles[i];
            const id = vehicle.getAttribute('id');
            const lat = vehicle.getAttribute('lat');
            const lon = vehicle.getAttribute('lon');
            vehicleListToHTML += `<option value="${id}">${id}</option>`;

            // Actualizar o crear marcadores para cada vehículo
            if (markers[id]) {
                markers[id].setLatLng([lat, lon]);
            } else {
                markers[id] = L.marker([lat, lon]).addTo(map);
            }
        }
        vehicleList.innerHTML = vehicleListToHTML;

        // Actualizar el último tiempo (lastTime)
        const lastTimeElement = xmlDoc.getElementsByTagName('lastTime')[0];
        if (lastTimeElement) {
            lastTime = lastTimeElement.getAttribute('time');
        }
    }

    async function fetchSelectedVehicleLocation() {
        if (selectedVehicleId && agencyTag) {
            const vehicleLocationUrl = `https://retro.umoiq.com/service/publicXMLFeed?command=vehicleLocation&a=${agencyTag}&v=${selectedVehicleId}`;
            const response = await fetch(vehicleLocationUrl);
            const data = await response.text();
            const xmlDoc = new DOMParser().parseFromString(data, "text/xml");

            const vehicle = xmlDoc.getElementsByTagName('vehicle')[0];
            console.log('Pase por aqui:');

            if (vehicle) {
                const lat = parseFloat(vehicle.getAttribute('lat'));
                const lon = parseFloat(vehicle.getAttribute('lon'));
                const speed = vehicle.getAttribute('speedKmHr');

                const popupContent = `<b>Vehicle:</b> ${selectedVehicleId}<br><b>Speed:</b> ${speed} km/h`;

                if (markers[selectedVehicleId]) {
                    markers[selectedVehicleId].setLatLng([lat, lon]);
                    markers[selectedVehicleId].bindPopup(popupContent).openPopup();
                } else {
                    markers[selectedVehicleId] = L.marker([lat, lon])
                        .bindPopup(popupContent)
                        .addTo(map)
                        .openPopup();
                }
                map.panTo([lat, lon]);
                if (tableCounter < 10) {
                    const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
                    const reverseResponse = await fetch(apiUrl);
                    const reverseData = await reverseResponse.json();
                    const road = reverseData.address.road || 'No street name was found';
                    console.log('Nombre de la calle:', road);

                    const { data: insertedData, error } = await database
                        .from('tracking')
                        .insert([
                            {
                                vehicle: selectedVehicleId,
                                position: [lat, lon],
                                positionGeocoded: road,
                                speed: speed
                            }
                        ])
                        .select('*');

                    if (error) {
                        console.error('Error inserting data into Supabase:', error);
                    } else {
                        console.log('Inserted data:', insertedData);
                        if (insertedData.length > 0) {
                            const insertedRecord = insertedData[0];
                            console.log('Vehicle:', insertedRecord.vehicle);
                            console.log('Position Geocoded:', insertedRecord.positionGeocoded);
                            console.log('Speed:', insertedRecord.speed);

                            insertVehicleData(insertedRecord.vehicle, insertedRecord.positionGeocoded, insertedRecord.speed);
                        }
                    }

                    tableCounter++;
                }
            }
        }
    }


    function insertVehicleData(vehicle, positionGeocoded, speed) {
        const tableBody = document.getElementById('vehicleData');

        // Remove "No data available" row if it exists
        const noDataRow = document.getElementById('noDataRow');
        if (noDataRow) {
            noDataRow.remove();
        }

        // Create new row with vehicle data
        const newRow = document.createElement('tr');

        const vehicleCell = document.createElement('td');
        vehicleCell.textContent = vehicle;
        vehicleCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        const positionCell = document.createElement('td');
        positionCell.textContent = positionGeocoded;
        positionCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        const speedCell = document.createElement('td');
        speedCell.textContent = speed;
        speedCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        newRow.appendChild(vehicleCell);
        newRow.appendChild(positionCell);
        newRow.appendChild(speedCell);

        tableBody.appendChild(newRow);
    }

    routeList.addEventListener('change', function () {
        selectedRouteTag = this.value;
        lastTime = 0; // Reiniciar lastTime cuando se cambia de ruta
        document.getElementById('svgSelectRoute').classList.remove('invisible');
        fetchVehicleLocations();
    });

    vehicleList.addEventListener('change', function () {
        selectedVehicleId = this.value;
        fetchSelectedVehicleLocation();

        if (fetchInterval) {
            clearInterval(fetchInterval);
        }
        document.getElementById('svgSelectVehicle').classList.remove('invisible');
        // Fetch data every 10 seconds
        fetchInterval = setInterval(fetchSelectedVehicleLocation, 10000);
    });

    getAgencyAndRouteList().then(({ routeListToHTML }) => {
        // Añadir las opciones obtenidas de routeList al final de la lista en lugar de reemplazar el contenido
        if (routeListToHTML) {
            routeList.innerHTML += routeListToHTML;
        }
    });

    async function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tableBody = document.getElementById('vehicleData');
        const rows = tableBody.querySelectorAll('tr');

        // Configurar estilos y título
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Vehicle Tracking Data', 14, 22);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Gilberto Fontanez A Software Developer Report', 14, 28);

        doc.setFontSize(12);
        let y = 44; // Posición inicial en Y

        // Agregar encabezados con estilo
        doc.setDrawColor(0); // Color del borde (negro)
        doc.setFillColor(200); // Color de fondo (gris claro)
        doc.setLineWidth(0.1); // Ancho del borde

        doc.rect(14, y, 56, 10, 'FD'); // Rectángulo para 'Vehicle'
        doc.rect(70, y, 70, 10, 'FD'); // Rectángulo para 'Position'
        doc.rect(140, y, 50, 10, 'FD'); // Rectángulo para 'Speed'

        doc.text('Vehicle', 18, y + 6); // Texto para 'Vehicle'
        doc.text('Position', 74, y + 6); // Texto para 'Position'
        doc.text('Speed', 144, y + 6); // Texto para 'Speed'

        y += 20;

        // Crear tabla en el PDF
        rows.forEach((row, index) => {
            const cols = row.querySelectorAll('td');
            if (cols.length > 0) {
                doc.text(cols[0].textContent, 22, y);
                doc.text(cols[1].textContent, 74, y);
                doc.text(cols[2].textContent, 146, y);
                y += 10;
            }
        });

        // Guardar el PDF
        doc.save('vehicle_tracking_data.pdf');
    }

    // Agregar evento al botón de descarga de PDF
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    downloadPdfBtn.addEventListener('click', generatePDF);


    function generateExcel() {
        // Crear un libro de Excel
        var workbook = XLSX.utils.book_new();
        // Crear una hoja de cálculo
        var sheetData = [['Vehicle Tracking Data'],
        ['Gilberto Fontanez A Software Developer Report'],
        [' '], ['Vehicle', 'Position', 'Speed']];
        var tableBody = document.getElementById('vehicleData');
        var rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const cols = row.querySelectorAll('td');
            if (cols.length > 0) {
                sheetData.push([
                    cols[0].textContent,
                    cols[1].textContent,
                    cols[2].textContent
                ]);
            }
        });
        var ws = XLSX.utils.aoa_to_sheet(sheetData);
        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(workbook, ws, 'Vehicle Tracking Data');
        // Guardar el archivo de Excel
        XLSX.writeFile(workbook, 'vehicle_tracking_data.xlsx');
    }

    // Agregar evento al botón de descarga de Excel
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    downloadExcelBtn.addEventListener('click', generateExcel);
});
