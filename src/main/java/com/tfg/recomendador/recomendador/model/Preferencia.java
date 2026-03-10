package com.tfg.recomendador.recomendador.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "preferencias_usuario")
public class Preferencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "id_pelicula")
    private Long itemId;

    private String tipo;  // "movie" o "tv"

    @Column(name = "fecha_seleccion")
    private LocalDateTime fechaSeleccion = LocalDateTime.now();

    // Getters y setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public LocalDateTime getFechaSeleccion() {
        return fechaSeleccion;
    }

    public void setFechaSeleccion(LocalDateTime fechaSeleccion) {
        this.fechaSeleccion = fechaSeleccion;
    }
}