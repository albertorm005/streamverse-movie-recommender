package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.model.ElementoLista;
import com.tfg.recomendador.recomendador.model.Pelicula;
import com.tfg.recomendador.recomendador.model.Usuario;
import com.tfg.recomendador.recomendador.service.HistorialService;
import com.tfg.recomendador.recomendador.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ListasUsuarioController {

    @Autowired
    private HistorialService historialService;

    @Autowired
    private UsuarioService usuarioService;

    // Listar historial del usuario actual
    @GetMapping("/historial/listar")
    public List<ElementoLista> listarHistorial() {
        Usuario usuarioActual = usuarioService.getUsuarioActual();
        return historialService.obtenerHistorialUsuario(usuarioActual.getIdUsuario());
    }

    // Agregar película/serie al historial
    @PostMapping("/historial/agregar")
    public ResponseEntity<?> agregarAlHistorial(@RequestBody ElementoLista elemento) {
        Usuario usuarioActual = usuarioService.getUsuarioActual();
        historialService.agregarElementoHistorial(usuarioActual.getIdUsuario(), elemento);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // Eliminar del historial
    @PostMapping("/historial/eliminar")
    public ResponseEntity<?> eliminarDelHistorial(@RequestBody Map<String, Object> datos) {
        Usuario usuarioActual = usuarioService.getUsuarioActual();
        Integer idElemento = Integer.valueOf(datos.get("id").toString());
        String tipo = (String) datos.get("tipo");
        historialService.eliminarElementoHistorial(usuarioActual.getIdUsuario(), idElemento, tipo);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // Listar favoritos del usuario actual
    @GetMapping("/favoritos/listar")
    public List<ElementoLista> listarFavoritos() {
        Usuario usuarioActual = usuarioService.getUsuarioActual();
        return historialService.obtenerFavoritosUsuario(usuarioActual.getIdUsuario());
    }

    // Agregar a favoritos
    @PostMapping("/favoritos/agregar")
    public ResponseEntity<?> agregarAFavoritos(@RequestBody ElementoLista elemento) {
        Usuario usuarioActual = usuarioService.getUsuarioActual();
        historialService.agregarElementoFavorito(usuarioActual.getIdUsuario(), elemento);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // Eliminar de favoritos
    @PostMapping("/favoritos/eliminar")
    public ResponseEntity<?> eliminarDeFavoritos(@RequestBody Map<String, Object> datos) {
        Usuario usuarioActual = usuarioService.getUsuarioActual();
        Integer idElemento = Integer.valueOf(datos.get("id").toString());
        String tipo = (String) datos.get("tipo");
        historialService.eliminarElementoFavorito(usuarioActual.getIdUsuario(), idElemento, tipo);
        return ResponseEntity.ok(Map.of("success", true));
    }
}