package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.service.OpinionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/opiniones")
public class OpinionController {

    @Autowired
    private OpinionService opinionService;

    @DeleteMapping("/{opinionId}")
    public ResponseEntity<?> eliminarOpinion(@PathVariable String opinionId, Authentication authentication) {
        String usuarioActual = authentication.getName();

        try {
            boolean eliminada = opinionService.eliminarOpinion(opinionId, usuarioActual);

            if (eliminada) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Opinión eliminada correctamente"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "success", false,
                        "message", "No tienes permiso para eliminar esta opinión"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Error al eliminar la opinión: " + e.getMessage()
            ));
        }
    }
}