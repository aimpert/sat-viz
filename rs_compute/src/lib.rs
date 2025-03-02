use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use pyo3::prelude::*;
use pyo3::wrap_pyfunction;

#[pyfunction]
fn calculate_timestamp(tle_1: &str) -> PyResult<String> {
    if tle_1.len() < 32 {
        return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
            "rs_compute: tle_1 is too short, timestamp cannot be calculated.",
        ));
    }
    //Field "7" 	18–19 	Epoch year (last two digits of year) 	
    //Field "8" 	20–31 	Epoch (day of the year and fractional portion of the day)
    //Indexing from 0^
    //Timestamp is YYYY-MM-DD HH:MI:SS

    let epoch_year = &tle_1[18..20];
    let epoch = &tle_1[20..32];

    let year = 2000 + epoch_year.parse::<i32>().map_err(|_| {
        PyErr::new::<pyo3::exceptions::PyValueError, _>("rs_compute: Failed to parse year.")
    })?;

    let day_of_year = epoch.parse::<f64>().map_err(|_| {
        PyErr::new::<pyo3::exceptions::PyValueError, _>("rs_compute: Failed to parse day of year.")
    })?;

    let date = NaiveDate::from_yo_opt(year, day_of_year as u32);

    let total_seconds = (day_of_year.fract() * 24.0 * 3600.0) as u32;
    let hours = total_seconds / 3600;
    let minutes = (total_seconds % 3600) / 60;
    let seconds = total_seconds % 60;

    let timestamp = NaiveDateTime::new(date.expect("rs.compute: Failed to unwrap NaiveDateTime."), NaiveTime::from_hms_opt(hours, minutes, seconds).expect("rs_compute: Failed to unwrap NaiveTime."));

    Ok(timestamp.to_string())
}

#[pymodule]
fn rs_compute(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(calculate_timestamp, m)?)?;
    Ok(())
}