package com.tfg.recomendador.recomendador.service;

import com.tfg.recomendador.recomendador.model.Pelicula;
import com.tfg.recomendador.recomendador.model.Preferencia;
import com.tfg.recomendador.recomendador.model.Serie;
import com.tfg.recomendador.recomendador.model.Usuario;
import com.tfg.recomendador.recomendador.repository.PreferenciaRepository;
import com.tfg.recomendador.recomendador.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RecomendacionesService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private PreferenciaRepository preferenciaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Value("${tmdb.api.key}")
    private String apiKey;

    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

    /**
     * Método general para obtener recomendaciones según el tipo
     * @param tipo Tipo de contenido ('movie' o 'tv')
     * @param username Nombre de usuario o correo electrónico
     * @return Mapa con resultados formateados para la API
     */
    public Map<String, Object> obtenerRecomendaciones(String tipo, String username) {
        Map<String, Object> response = new HashMap<>();

        // Obtener IDs de contenido ya preferido para excluirlos de las recomendaciones
        Set<Long> idsYaPreferidos = new HashSet<>();
        if ("movie".equals(tipo)) {
            idsYaPreferidos.addAll(obtenerIdsPeliculasPreferidas(username));
        } else {
            idsYaPreferidos.addAll(obtenerIdsSeriesPreferidas(username));
        }

        System.out.println("IDs de " + tipo + " ya preferidos (a excluir): " + idsYaPreferidos);

        // Obtener primero las recomendaciones por género (ahora nuestra principal fuente)
        List<?> resultadosPorGenero = obtenerRecomendacionesPorGenero(tipo, username, idsYaPreferidos);
        System.out.println("Obtenidas " + resultadosPorGenero.size() + " recomendaciones por género");

        // Complementar con recomendaciones basadas en contenido específico si es necesario
        List<?> resultadosPorContenido;
        if ("movie".equals(tipo)) {
            resultadosPorContenido = obtenerRecomendacionesPeliculas(username, idsYaPreferidos);
        } else if ("tv".equals(tipo)) {
            resultadosPorContenido = obtenerRecomendacionesSeries(username, idsYaPreferidos);
        } else {
            throw new IllegalArgumentException("Tipo no soportado: " + tipo);
        }
        System.out.println("Obtenidas " + resultadosPorContenido.size() + " recomendaciones por contenido");

        // Combinar resultados (evitando duplicados y priorizando por género)
        List<Object> resultadosCombinados = new ArrayList<>();
        Set<Long> idsIncluidos = new HashSet<>();

        // Primero agregar recomendaciones por género (prioridad)
        for (Object item : resultadosPorGenero) {
            Long itemId = getItemId(item);
            if (itemId != null && !idsIncluidos.contains(itemId)) {
                resultadosCombinados.add(item);
                idsIncluidos.add(itemId);
            }
        }

        // Luego complementar con recomendaciones basadas en contenido específico
        for (Object item : resultadosPorContenido) {
            Long itemId = getItemId(item);
            if (itemId != null && !idsIncluidos.contains(itemId)) {
                resultadosCombinados.add(item);
                idsIncluidos.add(itemId);
            }
        }

        System.out.println("Total final de recomendaciones: " + resultadosCombinados.size());
        response.put("results", resultadosCombinados);
        response.put("type", tipo);
        response.put("count", resultadosCombinados.size());
        return response;
    }

    public List<Pelicula> obtenerRecomendacionesPeliculas(String username, Set<Long> idsAExcluir) {
        List<Long> idsPeliculas = obtenerIdsPeliculasPreferidas(username);
        System.out.println("IDs de películas para recomendar: " + idsPeliculas);
        List<Pelicula> recomendaciones = new ArrayList<>();

        for (Long idPelicula : idsPeliculas) {
            try {
                String url = BASE_URL + "/movie/" + idPelicula + "/recommendations?api_key=" + apiKey + "&language=es-ES";
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);

                if (response != null && response.containsKey("results")) {
                    List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");

                    for (Map<String, Object> result : results) {
                        Number id = (Number) result.get("id");
                        if (id != null && !idsAExcluir.contains(id.longValue())) {
                            Pelicula pelicula = mapearPelicula(result);
                            if (!recomendaciones.stream().anyMatch(p -> p.getId() == pelicula.getId())) {
                                recomendaciones.add(pelicula);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error al obtener recomendaciones para película " + idPelicula + ": " + e.getMessage());
            }

            if (recomendaciones.size() >= 20) {
                break;
            }
        }

        System.out.println("Total de recomendaciones de películas: " + recomendaciones.size());
        return recomendaciones;
    }

    public List<Serie> obtenerRecomendacionesSeries(String username, Set<Long> idsAExcluir) {
        List<Long> idsSeries = obtenerIdsSeriesPreferidas(username);
        System.out.println("IDs de series para recomendar: " + idsSeries);
        List<Serie> recomendaciones = new ArrayList<>();

        for (Long idSerie : idsSeries) {
            try {
                String url = BASE_URL + "/tv/" + idSerie + "/recommendations?api_key=" + apiKey + "&language=es-ES";
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);

                if (response != null && response.containsKey("results")) {
                    List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");

                    for (Map<String, Object> result : results) {
                        Number id = (Number) result.get("id");
                        if (id != null && !idsAExcluir.contains(id.longValue())) {
                            Serie serie = mapearSerie(result);
                            if (!recomendaciones.stream().anyMatch(s -> s.getId() == serie.getId())) {
                                recomendaciones.add(serie);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error al obtener recomendaciones para serie " + idSerie + ": " + e.getMessage());
            }

            if (recomendaciones.size() >= 20) {
                break;
            }
        }

        System.out.println("Total de recomendaciones de series: " + recomendaciones.size());
        return recomendaciones;
    }

    /**
     * Obtiene recomendaciones basadas en géneros preferidos del usuario
     */
    public List<?> obtenerRecomendacionesPorGenero(String tipo, String username, Set<Long> idsAExcluir) {
        // Obtener géneros preferidos del usuario basados en sus elecciones
        List<Integer> generosPreferidos = obtenerGenerosPreferidos(username, tipo);
        System.out.println("Géneros preferidos para " + tipo + ": " + generosPreferidos);

        if (generosPreferidos.isEmpty()) {
            return new ArrayList<>();
        }

        if (tipo.equals("movie")) {
            List<Pelicula> peliculasActuales = new ArrayList<>();
            int totalResultados = 0;

            // Usar hasta 3 géneros diferentes si es posible para obtener resultados variados
            for (int i = 0; i < Math.min(3, generosPreferidos.size()); i++) {
                Integer generoId = generosPreferidos.get(i);
                List<Pelicula> resultadosGenero = (List<Pelicula>) obtenerContenidoPorGenero(tipo, generoId);

                if (resultadosGenero.isEmpty()) {
                    continue;
                }

                for (Pelicula pelicula : resultadosGenero) {
                    // Excluir IDs ya preferidos
                    if (!idsAExcluir.contains(pelicula.getId()) &&
                            !peliculasActuales.stream().anyMatch(p -> p.getId() == pelicula.getId())) {
                        peliculasActuales.add(pelicula);
                        totalResultados++;
                    }

                    if (totalResultados >= 15) break;
                }

                if (totalResultados >= 15) break;
            }

            System.out.println("Total de recomendaciones por género: " + totalResultados);
            return peliculasActuales;
        } else {
            List<Serie> seriesActuales = new ArrayList<>();
            int totalResultados = 0;

            // Usar hasta 3 géneros diferentes si es posible para obtener resultados variados
            for (int i = 0; i < Math.min(3, generosPreferidos.size()); i++) {
                Integer generoId = generosPreferidos.get(i);
                List<Serie> resultadosGenero = (List<Serie>) obtenerContenidoPorGenero(tipo, generoId);

                if (resultadosGenero.isEmpty()) {
                    continue;
                }

                for (Serie serie : resultadosGenero) {
                    // Excluir IDs ya preferidos
                    if (!idsAExcluir.contains(serie.getId()) &&
                            !seriesActuales.stream().anyMatch(s -> s.getId() == serie.getId())) {
                        seriesActuales.add(serie);
                        totalResultados++;
                    }

                    if (totalResultados >= 15) break;
                }

                if (totalResultados >= 15) break;
            }

            System.out.println("Total de recomendaciones por género: " + totalResultados);
            return seriesActuales;
        }
    }

    /**
     * Obtiene contenido por género específico
     */
    private List<?> obtenerContenidoPorGenero(String tipo, Integer generoId) {
        try {
            // Consultar la API de TMDB para descubrir contenido por género
            String url = BASE_URL + "/discover/" + tipo + "?api_key=" + apiKey
                    + "&language=es-ES&sort_by=popularity.desc&page=1"
                    + "&with_genres=" + generoId + "&vote_count.gte=50";
            System.out.println("Consultando contenido del género " + generoId + ": " + url);

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("results")) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
                System.out.println("Resultados obtenidos para género " + generoId + ": " + results.size());

                if ("movie".equals(tipo)) {
                    return results.stream()
                            .map(this::mapearPelicula)
                            .filter(p -> p != null)
                            .limit(10)
                            .collect(Collectors.toList());
                } else {
                    return results.stream()
                            .map(this::mapearSerie)
                            .filter(s -> s != null)
                            .limit(10)
                            .collect(Collectors.toList());
                }
            }
        } catch (Exception e) {
            System.err.println("Error al obtener contenido para género " + generoId + ": " + e.getMessage());
            e.printStackTrace();
        }

        return new ArrayList<>();
    }

    /**
     * Extrae los géneros preferidos del usuario basado en sus preferencias
     */
    private List<Integer> obtenerGenerosPreferidos(String username, String tipo) {
        Map<Integer, Integer> contadorGeneros = new HashMap<>();
        List<Long> idsItems;

        // Obtener IDs de películas o series favoritas
        if ("movie".equals(tipo)) {
            idsItems = obtenerIdsPeliculasPreferidas(username);
        } else {
            idsItems = obtenerIdsSeriesPreferidas(username);
        }

        System.out.println("IDs de items para analizar géneros: " + idsItems);

        // Si no hay preferencias, devolver géneros predeterminados populares
        if (idsItems.isEmpty()) {
            if ("movie".equals(tipo)) {
                return List.of(28, 12, 18); // Acción, Aventura, Drama
            } else {
                return List.of(10759, 18, 10765); // Acción & Aventura, Drama, Sci-Fi & Fantasía
            }
        }

        // Consultar detalles de cada ítem para extraer géneros
        for (Long itemId : idsItems) {
            try {
                String url = BASE_URL + "/" + tipo + "/" + itemId + "?api_key=" + apiKey + "&language=es-ES";
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);

                if (response != null && response.containsKey("genres")) {
                    List<Map<String, Object>> genres = (List<Map<String, Object>>) response.get("genres");

                    for (Map<String, Object> genre : genres) {
                        Integer genreId = ((Number) genre.get("id")).intValue();
                        contadorGeneros.put(genreId, contadorGeneros.getOrDefault(genreId, 0) + 1);
                    }
                }
            } catch (Exception e) {
                System.err.println("Error al obtener géneros para item " + itemId + ": " + e.getMessage());
            }
        }

        // Imprimir para depuración
        System.out.println("Conteo de géneros preferidos:");
        contadorGeneros.forEach((id, count) -> System.out.println("  Género ID " + id + ": " + count + " ocurrencias"));

        // Ordenar géneros por frecuencia
        List<Integer> generosPrincipales = contadorGeneros.entrySet().stream()
                .sorted(Map.Entry.<Integer, Integer>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        System.out.println("Géneros principales identificados: " + generosPrincipales);
        return generosPrincipales;
    }

    private Pelicula mapearPelicula(Map<String, Object> result) {
        try {
            Pelicula pelicula = new Pelicula();

            // Mapeo directo y simple para evitar problemas
            pelicula.setId(Long.valueOf(String.valueOf(result.get("id"))));
            pelicula.setTitle((String) result.get("title"));

            // Manejar URL de imagen directamente
            String posterPath = (String) result.get("poster_path");
            pelicula.setPosterPath(posterPath != null ?
                    IMAGE_BASE_URL + posterPath : "/img/no-poster.png");

            pelicula.setReleaseDate((String) result.get("release_date"));

            // Convertir puntuación a String y luego a Double para evitar problemas de casting
            Object voteAvg = result.get("vote_average");
            pelicula.setVoteAverage(voteAvg != null ?
                    Double.valueOf(String.valueOf(voteAvg)) : 0.0);

            pelicula.setOverview((String) result.get("overview"));

            System.out.println("Película mapeada: " + pelicula.getTitle());
            return pelicula;
        } catch (Exception e) {
            System.err.println("Error al mapear película: " + e.getMessage());

            // Devolver objeto con datos predeterminados
            Pelicula peliculaDefault = new Pelicula();
            peliculaDefault.setId(0L);
            peliculaDefault.setTitle("Error al cargar película");
            peliculaDefault.setPosterPath("/img/no-poster.png");
            peliculaDefault.setReleaseDate("N/A");
            peliculaDefault.setVoteAverage(0.0);
            peliculaDefault.setOverview("Sin descripción");
            return peliculaDefault;
        }
    }

    private Serie mapearSerie(Map<String, Object> result) {
        Serie serie = new Serie();

        // ID de la serie
        if (result.get("id") != null) {
            serie.setId(((Number) result.get("id")).longValue());
        }

        // Nombre
        String name = (String) result.get("name");
        serie.setName(name != null ? name : "Sin nombre");

        // Manejar imagen - primero intentar con poster_path, luego con backdrop_path
        String posterPath = (String) result.get("poster_path");
        String backdropPath = (String) result.get("backdrop_path");

        if (posterPath != null && !posterPath.isEmpty()) {
            serie.setPosterPath(IMAGE_BASE_URL + posterPath);
        } else if (backdropPath != null && !backdropPath.isEmpty()) {
            serie.setPosterPath(IMAGE_BASE_URL + backdropPath);
        } else {
            serie.setPosterPath("/img/no-poster.png");
        }

        // Fecha de primer episodio
        String firstAirDate = (String) result.get("first_air_date");
        serie.setFirstAirDate(firstAirDate != null && !firstAirDate.isEmpty() ? firstAirDate : "N/A");

        // Puntuación
        if (result.get("vote_average") != null) {
            double voteAverage;
            if (result.get("vote_average") instanceof Number) {
                voteAverage = ((Number) result.get("vote_average")).doubleValue();
            } else {
                voteAverage = Double.parseDouble(String.valueOf(result.get("vote_average")));
            }
            serie.setVoteAverage(voteAverage);
        } else {
            serie.setVoteAverage(0.0);
        }

        // Descripción
        String overview = (String) result.get("overview");
        serie.setOverview(overview != null && !overview.isEmpty() ? overview : "Sin descripción disponible");

        // Imprimir para depuración
        System.out.println("Serie mapeada: " + serie.getId() + " - " + serie.getName() +
                " - Poster: " + serie.getPosterPath() +
                " - Fecha: " + serie.getFirstAirDate() +
                " - Puntuación: " + serie.getVoteAverage());

        return serie;
    }

    private List<Long> obtenerIdsPeliculasPreferidas(String username) {
        Usuario usuario = usuarioRepository.findByEmail(username).orElse(null);
        if (usuario == null) {
            System.out.println("No se encontró usuario con email: " + username);
            return new ArrayList<>();
        }

        Integer usuarioId = usuario.getIdUsuario();
        List<Preferencia> preferencias = preferenciaRepository.findByUsuarioIdUsuario(usuarioId);
        System.out.println("Preferencias encontradas para usuario " + username + ": " + preferencias.size());

        List<Long> idsPeliculas = preferencias.stream()
                .filter(p -> "pelicula".equals(p.getTipo()) || "movie".equals(p.getTipo()))
                .map(Preferencia::getItemId)
                .collect(Collectors.toList());

        // Si no hay preferencias, usar IDs por defecto para películas populares
        if (idsPeliculas.isEmpty()) {
            idsPeliculas.add(299536L); // Avengers: Infinity War
            idsPeliculas.add(299534L); // Avengers: Endgame
            idsPeliculas.add(24428L);  // The Avengers
            idsPeliculas.add(157336L); // Interstellar
        }

        System.out.println("IDs de películas preferidas: " + idsPeliculas.size());
        return idsPeliculas;
    }

    private List<Long> obtenerIdsSeriesPreferidas(String username) {
        Usuario usuario = usuarioRepository.findByEmail(username).orElse(null);
        if (usuario == null) {
            System.out.println("No se encontró usuario con email: " + username);
            return new ArrayList<>();
        }

        Integer usuarioId = usuario.getIdUsuario();
        List<Preferencia> preferencias = preferenciaRepository.findByUsuarioIdUsuario(usuarioId);
        System.out.println("Preferencias encontradas para usuario " + username + ": " + preferencias.size());

        // Imprimir todas las preferencias para depuración
        preferencias.forEach(p -> System.out.println("Preferencia: tipo=" + p.getTipo() + ", itemId=" + p.getItemId()));

        // Usar un filtro más flexible para detectar series
        List<Long> idsSeries = preferencias.stream()
                .filter(p -> "serie".equalsIgnoreCase(p.getTipo()) ||
                        "tv".equalsIgnoreCase(p.getTipo()) ||
                        p.getTipo() != null && p.getTipo().toLowerCase().contains("tv") ||
                        p.getTipo() != null && p.getTipo().toLowerCase().contains("serie"))
                .map(Preferencia::getItemId)
                .collect(Collectors.toList());

        System.out.println("Series identificadas en preferencias: " + idsSeries);

        // Si no hay preferencias o si hay muy pocas, complementar con algunas predeterminadas
        if (idsSeries.size() < 2) {
            // Mantener las que ya existen
            List<Long> seriesPredeterminadas = new ArrayList<>(idsSeries);

            // Agregar series populares si hacen falta
            if (!idsSeries.contains(1399L)) seriesPredeterminadas.add(1399L);  // Game of Thrones
            if (!idsSeries.contains(1396L)) seriesPredeterminadas.add(1396L);  // Breaking Bad
            if (!idsSeries.contains(66732L)) seriesPredeterminadas.add(66732L); // Stranger Things
            if (!idsSeries.contains(1402L)) seriesPredeterminadas.add(1402L);  // The Walking Dead

            idsSeries = seriesPredeterminadas;
            System.out.println("Complementando con series predeterminadas: " + idsSeries);
        }

        return idsSeries;
    }

    private Long getItemId(Object item) {
        if (item instanceof Pelicula) {
            return ((Pelicula) item).getId();
        } else if (item instanceof Serie) {
            return ((Serie) item).getId();
        }
        return null;
    }

    // Métodos de compatibilidad para evitar errores con código existente
    public List<Pelicula> obtenerRecomendacionesPeliculas(String username) {
        return obtenerRecomendacionesPeliculas(username, new HashSet<>());
    }

    public List<Serie> obtenerRecomendacionesSeries(String username) {
        return obtenerRecomendacionesSeries(username, new HashSet<>());
    }

    public List<?> obtenerRecomendacionesPorGenero(String tipo, String username) {
        return obtenerRecomendacionesPorGenero(tipo, username, new HashSet<>());
    }
}