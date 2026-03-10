// js/seleccion-preferencias.js
document.addEventListener('DOMContentLoaded', function() {
    const apiKey = 'd2fb4020c31c94d183d054edf1e50b08'; // La API key de TMDB ya configurada
    const seleccionadas = [];
    const maxSeleccion = 5;
    let tipoActual = 'movie'; // Comienza con películas
    let paginaActual = 1;
    let cargando = false;

    // Inicializar
    cargarContenido(tipoActual, paginaActual);
    configurarEventos();

    function configurarEventos() {
        // Configurar tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelector('.tab-btn.active').classList.remove('active');
                tab.classList.add('active');
                tipoActual = tab.dataset.type;
                paginaActual = 1; // Resetear a primera página
                limpiarContenedor();
                cargarContenido(tipoActual, paginaActual);
            });
        });

        // Configurar búsqueda
        const searchButton = document.getElementById('searchButton');
        const searchInput = document.getElementById('searchInput');

        searchButton.addEventListener('click', realizarBusqueda);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                realizarBusqueda();
            }
        });

        // Configurar botón continuar
        document.getElementById('btnContinuar').addEventListener('click', guardarPreferencias);

        // Añadir evento de scroll para cargar más contenido
        window.addEventListener('scroll', function() {
            if (cargando) return;

            // Si el usuario está cerca del final de la página, cargar más contenido
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
                paginaActual++;
                cargarMasContenido(tipoActual, paginaActual);
            }
        });
    }

    async function realizarBusqueda() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        limpiarContenedor();

        try {
            cargando = true;
            const endpoint = tipoActual === 'movie' ? 'search/movie' : 'search/tv';
            const response = await fetch(
                `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(query)}&page=1`
            );
            const data = await response.json();

            if (data.results.length === 0) {
                document.getElementById('peliculas-container').innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                        <p>No se encontraron resultados para "${query}"</p>
                    </div>
                `;
            } else {
                mostrarContenido(data.results, tipoActual);
            }

            cargando = false;
        } catch (error) {
            console.error('Error al realizar búsqueda:', error);
            cargando = false;
        }
    }

    function limpiarContenedor() {
        const container = document.getElementById('peliculas-container');
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Cargando contenido...</p>
            </div>
        `;
    }

    async function cargarContenido(tipo, pagina) {
        try {
            cargando = true;
            const endpoint = tipo === 'movie' ? 'movie/popular' : 'tv/popular';
            const response = await fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=es-ES&page=${pagina}`);
            const data = await response.json();
            mostrarContenido(data.results, tipo);
            cargando = false;
        } catch (error) {
            console.error('Error al cargar contenido:', error);
            document.getElementById('peliculas-container').innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                    <p>Error al cargar el contenido. Por favor, inténtalo de nuevo.</p>
                </div>
            `;
            cargando = false;
        }
    }

    async function cargarMasContenido(tipo, pagina) {
        try {
            // Mostrar indicador de carga al final
            const container = document.getElementById('peliculas-container');
            const loadingMore = document.createElement('div');
            loadingMore.className = 'loading-more';
            loadingMore.innerHTML = `
                <div class="spinner"></div>
                <p>Cargando más contenido...</p>
            `;
            container.appendChild(loadingMore);

            cargando = true;
            const endpoint = tipo === 'movie' ? 'movie/popular' : 'tv/popular';
            const response = await fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=es-ES&page=${pagina}`);
            const data = await response.json();

            // Eliminar indicador de carga
            container.removeChild(loadingMore);

            // Añadir nuevos resultados
            mostrarMasContenido(data.results, tipo);
            cargando = false;
        } catch (error) {
            console.error('Error al cargar más contenido:', error);
            cargando = false;
        }
    }

    function mostrarContenido(contenidos, tipo) {
        const container = document.getElementById('peliculas-container');
        container.innerHTML = ''; // Limpiar el contenedor
        agregarContenidoAlDOM(contenidos, tipo, container);
    }

    function mostrarMasContenido(contenidos, tipo) {
        const container = document.getElementById('peliculas-container');
        agregarContenidoAlDOM(contenidos, tipo, container);
    }

    function agregarContenidoAlDOM(contenidos, tipo, container) {
        contenidos.forEach(item => {
            // Saltarse elementos sin título o nombre
            if (!item.title && !item.name) return;

            const titulo = tipo === 'movie' ? item.title : item.name;

            const elemento = document.createElement('div');
            elemento.className = 'pelicula-card';
            elemento.dataset.id = item.id;
            elemento.dataset.tipo = tipo;

            // Verificar si tiene poster
            const posterPath = item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : 'https://via.placeholder.com/300x450?text=Sin+Imagen';

            elemento.innerHTML = `
                <img src="${posterPath}" alt="${titulo}">
                <h3>${titulo}</h3>
            `;

            // Verificar si ya está seleccionada
            const yaSeleccionada = seleccionadas.some(sel => sel.id === item.id && sel.tipo === tipo);
            if (yaSeleccionada) {
                elemento.classList.add('seleccionada');
            }

            elemento.addEventListener('click', () => seleccionarItem(elemento, item.id, tipo));
            container.appendChild(elemento);
        });
    }

    function seleccionarItem(elemento, itemId, tipo) {
        // Crear un objeto con id y tipo para nuestras seleccionadas
        const seleccion = { id: itemId, tipo: tipo };
        const index = seleccionadas.findIndex(item => item.id === itemId && item.tipo === tipo);
        const contador = document.getElementById('numSeleccionadas');
        const btnContinuar = document.getElementById('btnContinuar');

        if (index === -1) { // No está seleccionada
            if (seleccionadas.length < maxSeleccion) {
                seleccionadas.push(seleccion);
                elemento.classList.add('seleccionada');
                contador.textContent = seleccionadas.length;

                if (seleccionadas.length === maxSeleccion) {
                    btnContinuar.disabled = false;
                }
            }
        } else { // Ya está seleccionada, la quitamos
            seleccionadas.splice(index, 1);
            elemento.classList.remove('seleccionada');
            contador.textContent = seleccionadas.length;
            btnContinuar.disabled = true;
        }
    }

    function guardarPreferencias() {
        // Solo continuar si tenemos exactamente 5 selecciones
        if (seleccionadas.length !== maxSeleccion) return;

        // Separar películas y series
        const peliculasIds = seleccionadas
            .filter(item => item.tipo === 'movie')
            .map(item => item.id);

        const seriesIds = seleccionadas
            .filter(item => item.tipo === 'tv')
            .map(item => item.id);

        // Enviar las preferencias al backend
        fetch('/api/preferencias/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                peliculasIds: peliculasIds,
                seriesIds: seriesIds
            })
        })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/recomendaciones.html';
                } else {
                    throw new Error('Error al guardar preferencias');
                }
            })
            .catch(error => console.error('Error:', error));
    }
});