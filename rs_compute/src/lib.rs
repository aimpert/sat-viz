use pyo3::prelude::*;
use pyo3::wrap_pyfunction;

#[pyfunction]
fn calculate_orbit(speed: f64, altitude: f64) -> f64 {
    let earth_radius = 6371.0;
    let orbital_radius = earth_radius + altitude;
    let period = 2.0 * std::f64::consts::PI * (orbital_radius / speed);
    period
}

#[pymodule]
fn rs_compute(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(calculate_orbit, m)?)?;
    Ok(())
}