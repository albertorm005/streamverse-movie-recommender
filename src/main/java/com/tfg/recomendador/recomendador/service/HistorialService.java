package com.tfg.recomendador.recomendador.service;

import com.tfg.recomendador.recomendador.model.ElementoLista;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HistorialService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Historial
    public List<ElementoLista> obtenerHistorialUsuario(Integer idUsuario) {
        return jdbcTemplate.query(
                "SELECT elemento_id, tipo, titulo, fecha, imagen_url FROM historial WHERE id_usuario = ?",
                (rs, rowNum) -> new ElementoLista(
                        rs.getInt("elemento_id"),
                        rs.getString("tipo"),
                        rs.getString("titulo"),
                        rs.getString("fecha"),
                        rs.getString("imagen_url")
                ),
                idUsuario
        );
    }

    public void agregarElementoHistorial(Integer idUsuario, ElementoLista elemento) {
        // Verificar si ya existe
        int count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM historial WHERE id_usuario = ? AND elemento_id = ? AND tipo = ?",
                Integer.class,
                idUsuario, elemento.getId(), elemento.getTipo());

        if (count == 0) {
            // Si no existe, insertarlo
            jdbcTemplate.update(
                    "INSERT INTO historial (id_usuario, elemento_id, tipo, titulo, fecha, imagen_url) VALUES (?, ?, ?, ?, ?, ?)",
                    idUsuario, elemento.getId(), elemento.getTipo(), elemento.getTitulo(), elemento.getFecha(), elemento.getImagen()
            );
        }
    }

    public void eliminarElementoHistorial(Integer idUsuario, Integer elementoId, String tipo) {
        jdbcTemplate.update(
                "DELETE FROM historial WHERE id_usuario = ? AND elemento_id = ? AND tipo = ?",
                idUsuario, elementoId, tipo
        );
    }

    // Favoritos
    public List<ElementoLista> obtenerFavoritosUsuario(Integer idUsuario) {
        return jdbcTemplate.query(
                "SELECT elemento_id, tipo, titulo, fecha, imagen_url FROM favoritos WHERE id_usuario = ?",
                (rs, rowNum) -> new ElementoLista(
                        rs.getInt("elemento_id"),
                        rs.getString("tipo"),
                        rs.getString("titulo"),
                        rs.getString("fecha"),
                        rs.getString("imagen_url")
                ),
                idUsuario
        );
    }

    public void agregarElementoFavorito(Integer idUsuario, ElementoLista elemento) {
        // Verificar si ya existe
        int count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM favoritos WHERE id_usuario = ? AND elemento_id = ? AND tipo = ?",
                Integer.class,
                idUsuario, elemento.getId(), elemento.getTipo());

        if (count == 0) {
            // Si no existe, insertarlo
            jdbcTemplate.update(
                    "INSERT INTO favoritos (id_usuario, elemento_id, tipo, titulo, fecha, imagen_url) VALUES (?, ?, ?, ?, ?, ?)",
                    idUsuario, elemento.getId(), elemento.getTipo(), elemento.getTitulo(), elemento.getFecha(), elemento.getImagen()
            );
        }
    }

    public void eliminarElementoFavorito(Integer idUsuario, Integer elementoId, String tipo) {
        jdbcTemplate.update(
                "DELETE FROM favoritos WHERE id_usuario = ? AND elemento_id = ? AND tipo = ?",
                idUsuario, elementoId, tipo
        );
    }
}