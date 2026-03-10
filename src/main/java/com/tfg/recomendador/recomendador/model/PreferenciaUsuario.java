package com.tfg.recomendador.recomendador.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "preferencias_usuario")
public class PreferenciaUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "id_pelicula", nullable = false)
    private Integer idPelicula;

    @Column(name = "tipo", nullable = false)
    private String tipo; // "pelicula" o "serie"

    @Column(name = "fecha_seleccion")
    private LocalDateTime fechaSeleccion = LocalDateTime.now();

    // Getters y setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Integer getIdPelicula() {
        return idPelicula;
    }

    public void setIdPelicula(Integer idPelicula) {
        this.idPelicula = idPelicula;
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