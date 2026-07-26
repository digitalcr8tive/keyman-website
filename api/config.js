const validGoogleAppointmentUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "calendar.google.com" &&
      url.pathname.includes("/calendar/appointments/")
    );
  } catch {
    return false;
  }
};

export default function handler(_request, response) {
  response.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  const configuredUrl = process.env.GOOGLE_APPOINTMENT_URL || "";
  response.status(200).json({
    googleAppointmentUrl: validGoogleAppointmentUrl(configuredUrl) ? configuredUrl : ""
  });
}
