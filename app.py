# Instalar:  pip install flask
# Ejecutar:  python app.py   → abre http://127.0.0.1:5000
import os
import re
import secrets
import sqlite3
from datetime import datetime

# Se agregaron redirect, session y url_for
from flask import Flask, jsonify, redirect, render_template, request, session, url_for

app = Flask(__name__)  # sirve /static y usa /templates automáticamente
# Clave secreta requerida por Flask para firmar las sesiones de usuario
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "pec-sesion-secreta-2026")

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE, "reportes.db")

# Credenciales de administrador (puedes cambiarlas aquí o con variables de entorno)
USUARIO_ADMIN = os.environ.get("PEC_ADMIN_USER", "admin")
CLAVE_ADMIN = os.environ.get("PEC_ADMIN_CLAVE", "pec2026")

TIPOS = {"opinion": "Opinión", "reporte": "Reporte de riesgo", "sugerencia": "Sugerencia"}
CORREO_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def consulta(sql, params=(), leer=False):
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    try:
        cur = con.execute(sql, params)
        filas = cur.fetchall() if leer else None
        con.commit()
        return filas
    finally:
        con.close()


def iniciar_db():
    consulta(
        """CREATE TABLE IF NOT EXISTS reportes (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               fecha TEXT NOT NULL,
               tipo TEXT NOT NULL,
               nombre TEXT NOT NULL,
               correo TEXT,
               mensaje TEXT NOT NULL)"""
    )


iniciar_db()


# ---------- Páginas ----------
@app.get("/")
def inicio():
    return render_template("index.html")


@app.get("/nosotros")
def nosotros():
    return render_template("nosotros.html")


@app.get("/riesgos")
def riesgos():
    return render_template("riesgos.html")


@app.get("/proyectos")
def proyectos():
    return render_template("proyectos.html")


@app.get("/juego")
def juego():
    return render_template("juego.html")


@app.get("/contacto")
def contacto():
    return render_template("contacto.html")


@app.get("/testimonios")
def testimonios():
    return render_template("testimonio.html")


# ---------- Formulario: guarda opiniones y reportes ----------
@app.post("/api/reportes")
def guardar_reporte():
    datos = request.get_json(silent=True) or request.form
    tipo = (datos.get("tipo") or "").strip()
    nombre = (datos.get("nombre") or "").strip()[:80]
    correo = (datos.get("correo") or "").strip()[:120]
    mensaje = (datos.get("mensaje") or "").strip()[:1000]

    errores = {}
    if tipo not in TIPOS:
        errores["tipo"] = "Elige qué quieres enviar."
    if len(nombre) < 2:
        errores["nombre"] = "Escribe tu nombre."
    if correo and not CORREO_RE.match(correo):
        errores["correo"] = "El correo no parece válido."
    if len(mensaje) < 10:
        errores["mensaje"] = "Cuéntanos un poco más (mínimo 10 caracteres)."
    if errores:
        return jsonify(ok=False, errores=errores), 400

    consulta(
        "INSERT INTO reportes (fecha, tipo, nombre, correo, mensaje) VALUES (?, ?, ?, ?, ?)",
        (datetime.now().strftime("%Y-%m-%d %H:%M"), tipo, nombre, correo or None, mensaje),
    )
    return jsonify(ok=True), 201


# ---------- Autenticación y Administración ----------
@app.route("/login", methods=["GET", "POST"])
def login():
    # Si ya inició sesión, lo manda directo a /admin
    if session.get("es_admin"):
        return redirect(url_for("admin"))

    error = None
    if request.method == "POST":
        usuario = (request.form.get("usuario") or "").strip()
        clave = request.form.get("clave") or ""

        # Se mantiene compare_digest para comparar contraseñas de forma segura
        usuario_valido = secrets.compare_digest(usuario, USUARIO_ADMIN)
        clave_valida = secrets.compare_digest(clave, CLAVE_ADMIN)

        if usuario_valido and clave_valida:
            session["es_admin"] = True
            return redirect(url_for("admin"))
        else:
            error = "Usuario o contraseña incorrectos."

    return render_template("login.html", error=error)


@app.get("/logout")
def logout():
    session.pop("es_admin", None)
    return redirect(url_for("inicio"))


@app.get("/admin")
def admin():
    if not session.get("es_admin"):
        return redirect(url_for("login"))

    filas = consulta("SELECT * FROM reportes ORDER BY id DESC", leer=True)

    # Contadores por tipo para las tarjetas de resumen
    resumen = {
        "total": len(filas),
        "reporte": sum(1 for f in filas if f["tipo"] == "reporte"),
        "opinion": sum(1 for f in filas if f["tipo"] == "opinion"),
        "sugerencia": sum(1 for f in filas if f["tipo"] == "sugerencia"),
    }
    return render_template("admin.html", filas=filas, tipos=TIPOS, resumen=resumen)


@app.post("/admin/eliminar/<int:reporte_id>")
def eliminar_reporte(reporte_id):
    if not session.get("es_admin"):
        return redirect(url_for("login"))

    consulta("DELETE FROM reportes WHERE id = ?", (reporte_id,))
    return redirect(url_for("admin"))


if __name__ == "__main__":
    app.run(debug=True)


if __name__ == "__main__":
    app.run(debug=True)  # quita debug=True si algún día publicas el sitio