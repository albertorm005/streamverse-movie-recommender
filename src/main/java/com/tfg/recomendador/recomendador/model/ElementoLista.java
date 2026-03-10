package com.tfg.recomendador.recomendador.model;

public class ElementoLista {
    private Integer id;
    private String tipo;  // "movie" o "tv"
    private String titulo;
    private String fecha;
    private String imagen;

    // Constructores, getters y setters
    public ElementoLista() {}

    public ElementoLista(Integer id, String tipo, String titulo, String fecha, String imagen) {
        this.id = id;
        this.tipo = tipo;
        this.titulo = titulo;
        this.fecha = fecha;
        this.imagen = imagen;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }
}