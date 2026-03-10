package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.model.Pelicula;
import com.tfg.recomendador.recomendador.model.Serie;
import com.tfg.recomendador.recomendador.service.RecomendacionesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recomendaciones")
public class RecomendacionesController {

    @Autowired
    private RecomendacionesService recomendacionesService;

    @GetMapping("/{tipo}")
    public ResponseEntity<?> obtenerRecomendaciones(@PathVariable String tipo,
                                                    Authentication authentication) {
        try {
            // Verificar si la autenticación existe antes de intentar obtener el nombre
            String username = (authentication != null) ? authentication.getName() : "anonymous";
            return ResponseEntity.ok(recomendacionesService.obtenerRecomendaciones(tipo, username));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error al obtener recomendaciones"));
        }
    }
}