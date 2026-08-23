import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosClient;


// ==============================
// HEALTH
// ==============================

export async function checkHealth() {
    const response = await axiosClient.get("/health");
    return response.data;
}


// ==============================
// INCIDENTS
// ==============================

export async function getIncidents() {
    const response = await axiosClient.get("/incidents");
    return response.data;
}


export async function getIncidentStats() {
    const response = await axiosClient.get("/incidents/stats");
    return response.data;
}


export async function getIncident(incidentId) {
    const response = await axiosClient.get(
        `/incidents/${incidentId}`
    );

    return response.data;
}


// ==============================
// REPORTS
// ==============================

export async function getReports() {
    const response = await axiosClient.get("/reports");
    return response.data;
}


export async function getReport(reportId) {
    const response = await axiosClient.get(
        `/reports/${reportId}`
    );

    return response.data;
}