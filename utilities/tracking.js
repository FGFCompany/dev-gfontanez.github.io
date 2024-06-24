document.addEventListener("DOMContentLoaded", function () {
    // Función para establecer una cookie sin expiración
    function setCookie(name, value) {
        document.cookie = name + "=" + value + ";path=/";
    }

    // Función para obtener una cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Comprobar si la cookie de sesión existe
    let sessionID = getCookie("sessionID");

    if (!sessionID) {
        // No hay cookie de sesión, crear una nueva
        sessionID = Math.random().toString(36).substring(2);  // Generar un ID de sesión aleatorio
        setCookie("sessionID", sessionID);  // Establecer la cookie de sesión sin expiración
        fetchSelectedVehicleLocation(sessionID);
    } else {
        // La cookie de sesión existe, continuar usándola
        console.log("ID existente:", sessionID);
    }


    const database = supabase.createClient('https://svdtdtpqscizmxlcicox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZHRkdHBxc2Npem14bGNpY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2NTU2ODEsImV4cCI6MjAzMjIzMTY4MX0.9Hkev2jhj11Q6r6DXrf2gpixaVTDj2vODRYwpxB5Y50');
    const map = L.map('map').setView([37.7749, -122.4194], 17);
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

    // Función para obtener las ubicaciones de los vehículos
    async function fetchVehicleLocations() {
        const vehicleLocationUrl = `https://retro.umoiq.com/service/publicXMLFeed?command=vehicleLocations&a=${agencyTag}&r=${selectedRouteTag}&t=${lastTime}`;
        const response = await fetch(vehicleLocationUrl);
        const data = await response.text();
        const xmlDoc = new DOMParser().parseFromString(data, "text/xml");

        const vehicles = xmlDoc.getElementsByTagName('vehicle');
        let vehicleListToHTML = '';
        if (vehicles.length > 0) {
            vehicleListToHTML = '<option value="">Select Vehicle...</option>';
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
        } else {
            vehicleListToHTML = '<option value="">No vehicles in use. Please check another route.</option>';
        }
        vehicleList.innerHTML = vehicleListToHTML;

        // Actualizar el último tiempo (lastTime)
        // lastTime se utiliza como request para almacenar el tiempo de la última actualización de los datos por ruta y reducir el uso de ancho de banda
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
                    const address = reverseData.address || 'No street name was found';
                    console.log('Nombre de la calle:', address.state);

                    const { data: insertedData, error } = await database
                        .from('tracking')
                        .insert([
                            {
                                vehicle: selectedVehicleId,
                                position: [lat, lon],
                                positionGeocoded: address.road + ', ' + address.state,
                                speed: speed,
                                tempuser: sessionID
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

                            insertVehicleData(insertedRecord.vehicle, insertedRecord.positionGeocoded, insertedRecord.speed, insertedRecord.created_at, insertedRecord.id);
                        }
                    }

                    tableCounter++;
                }
            }
        }
    }


    function insertVehicleData(vehicle, positionGeocoded, speed, created_at, id) {
        const tableBody = document.getElementById('vehicleData');

        // Remove "No data available" row if it exists
        const noDataRow = document.getElementById('noDataRow');
        if (noDataRow) {
            noDataRow.remove();
        }

        // Create new row with vehicle data
        const newRow = document.createElement('tr');

        const vehicleCell = document.createElement('td');
        const vehicleLink = document.createElement('a');
        vehicleLink.textContent = vehicle;
        vehicleLink.classList.add('vehicleSelect', 'hover:underline', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-sky-500', 'dark:text-sky-400');
        vehicleCell.appendChild(vehicleLink);
        vehicleCell.style.maxWidth = '150px';
        vehicleCell.style.overflow = 'hidden';
        vehicleCell.style.textOverflow = 'ellipsis';

        const addressCell = document.createElement('td');
        addressCell.textContent = positionGeocoded;
        addressCell.classList.add('addressSelect', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        const speedCell = document.createElement('td');
        speedCell.textContent = speed + ' km/h';
        speedCell.classList.add('speedSelect', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        const timestampCell = document.createElement('td');
        const date = new Date(created_at);
        timestampCell.textContent = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        timestampCell.classList.add('timestampSelect', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        const idCell = document.createElement('td');
        idCell.textContent = id;
        idCell.value = id;
        idCell.classList.add('idSelect', 'hidden', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');


        newRow.appendChild(timestampCell);
        newRow.appendChild(vehicleCell);
        newRow.appendChild(addressCell);
        newRow.appendChild(speedCell);
        newRow.appendChild(idCell);

        tableBody.appendChild(newRow);
        addRowClickListeners()
    }


    // Función para agregar eventos de clic a las filas de la tabla
    function addRowClickListeners() {
        document.querySelectorAll('tr').forEach(row => {
            // Remover cualquier evento de clic existente
            row.removeEventListener('click', rowTrackingSelected);

            // Agregar el nuevo evento de clic
            row.addEventListener('click', rowTrackingSelected);
        });
    }

    // Función manejadora del evento de clic en las filas
    async function rowTrackingSelected(event) {
        selectedRow = event.currentTarget; // Guardar la fila seleccionada
        console.log('Selected row:', selectedRow);
        const idSelect = selectedRow.querySelector('.idSelect').value;
        console.log('idSelect:', idSelect);
        const { data: rowTrackingSelected, error } = await database
            .from('tracking')
            .select('*')
            .eq('id', idSelect);
        if (error) {
            console.error(error);
        } else {
            const vehicleSelect = rowTrackingSelected[0].vehicle;
            const coordinatesSelect = JSON.parse(rowTrackingSelected[0].position);
            console.log('coordinatesSelect:', coordinatesSelect);
            const addressSelect = rowTrackingSelected[0].positionGeocoded;
            const speedSelect = rowTrackingSelected[0].speed;
            const timestampSelect = rowTrackingSelected[0].created_at;
            // Mostrar el modal con id "static-modal"
            const modal = document.getElementById('static-modal');
            modal.style.display = 'flex';
            document.getElementById('modalTitle').innerText = 'Vehicle-' + vehicleSelect;
            const trackingSelectedPdfBtn = document.getElementById('trackingSelectedPdfBtn');
            trackingSelectedPdfBtn.classList.remove('hidden');
            trackingSelectedPdfBtn.classList.add('inline-flex');
            // Agregar los a values en los campos
            document.getElementById('vehicle').value = vehicleSelect;
            const coordinates = 'Latitude: ' + coordinatesSelect[0] + ', ' + 'Longitude: ' + coordinatesSelect[1];
            document.getElementById('coordinates').value = coordinates;
            document.getElementById('address').value = addressSelect;
            document.getElementById('speed').value = speedSelect + ' km/h';
            const date = new Date(timestampSelect);
            document.getElementById('timestamp').value = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });

            // Crear el selected mapa
            // Verificar si el contenedor ya tiene un mapa inicializado
            if (L.DomUtil.get('trackingSelectedMap') !== null) {
                // Si ya hay un mapa, eliminarlo antes de crear uno nuevo
                L.DomUtil.get('trackingSelectedMap')._leaflet_id = null;
            }

            const popupContent = `<b>Vehicle:</b> ${vehicleSelect} <br><b>Address:</b> ${addressSelect} <br>`;
            selectedMap = L.map('trackingSelectedMap').setView([coordinatesSelect[0], coordinatesSelect[1]], 18);
            console.log('selectedMap coordinates:', coordinatesSelect);
            const tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png';
            L.tileLayer(tileUrl, {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(selectedMap);
            L.marker([coordinatesSelect[0], coordinatesSelect[1]]).addTo(selectedMap).bindPopup(popupContent).openPopup();


            trackingSelectedPdfBtn.addEventListener('click', () => {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                const trackingSelectedMap = document.getElementById('trackingSelectedMap');
                html2canvas(trackingSelectedMap, {
                    logging: true,
                    scale: 1,
                    letterRenderer: 1,
                    useCORS: true
                }).then(canvas => {
                    const imgWidth = 130;
                    const imgHeight = canvas.height * imgWidth / canvas.width;
                    const imgData = canvas.toDataURL('image/png');
                    pdf.addImage(imgData, 'PNG', 5, 10, imgWidth, imgHeight);
                    const filename = 'vehicle_selected_tracking.pdf';
                    pdf.save(filename);
                })

            });
            // Cerrar el modal al hacer clic en cualquier lugar de la pantalla
            const closeBtn = document.getElementById('closeBtn');
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

    }

    // Selects    
    routeList.addEventListener('change', function () {
        selectedRouteTag = this.value;
        lastTime = 0; // Reiniciar lastTime para cuando se cambia de ruta obtener datos nuevos al ultimo return del route API ya almacenado.
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

    // Reports 
    async function generatePDF(event) {
        event.preventDefault();
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
        doc.text('Address', 74, y + 6); // Texto para 'Position'
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

        // Configurar la acción de impresión automática
        doc.autoPrint();

        // Abrir el documento PDF en una nueva pestaña o ventana del navegador
        const filename = 'vehicle_tracking_data.pdf';
        doc.save(filename);

    }

    // Agregar evento al botón de descarga de PDF
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    downloadPdfBtn.addEventListener('click', generatePDF);


    function generateExcel(event) {
        event.preventDefault();
        // Crear un libro de Excel
        var workbook = XLSX.utils.book_new();
        // Crear una hoja de cálculo
        var sheetData = [['Vehicle Tracking Data'],
        ['Gilberto Fontanez A Software Developer Report'],
        [' '], ['Vehicle', 'Address', 'Speed']];
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
