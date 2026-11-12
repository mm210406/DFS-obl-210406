import { Groq } from "groq-sdk";

const SUGGESTIONS_REQUESTED = 5;

const buildPrompt = (reviews, allowedGenres) => {
  const reviewList = reviews
    .map(
      (review) =>
        `- ${review.title} (puntaje ${review.points}/10, géneros: ${review.genres.join(", ")}, fecha: ${review.date}, comentario: "${review.description}")`,
    )
    .join("\n");

  return `Sos el recomendador de CineReview, una plataforma de reseñas de películas apta para toda la familia.
Estas son las películas que el usuario reseñó:
${reviewList}

Recomendá ${SUGGESTIONS_REQUESTED} películas que el usuario no haya reseñado, parecidas a las que mejor puntuó y aptas para todo público.
Si los hay, tené en cuenta los comentarios específicos de qué parte disfrutaron más, y de las edades de los personajes, para recomendar películas similares.
Tené más en cuenta las reseñas más nuevas y mejor puntuadas.
No incluyas en la respuesta ninguna película que ya haya reseñado, ni siquiera para aclarar que la omitís: cada recomendación tiene que ser una película nueva para el usuario.
Usá solo películas de estos géneros: ${allowedGenres.join(", ")}.
Respondé únicamente con JSON, sin texto adicional, con este formato:
{"recommendations":[{"title":"título original","year":2000,"reason":"una frase breve en español"}]}`;
};

const parseSuggestions = (text) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end < start) return [];

  try {
    const data = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(data.recommendations) ? data.recommendations : [];
  } catch (error) {
    return [];
  }
};

export const generateRecommendationsService = async (reviews, allowedGenres) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY no configurada");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 15000, maxRetries: 0 });
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: buildPrompt(reviews, allowedGenres) }],
    temperature: 0.7,
    max_completion_tokens: 1024,
    reasoning_effort: "low",
  });

  const suggestions = parseSuggestions(completion.choices[0]?.message?.content || "")
    .filter((suggestion) => typeof suggestion.title === "string" && suggestion.title.trim())
    .map((suggestion) => ({
      title: suggestion.title.trim(),
      year: Number(suggestion.year) || null,
      reason: typeof suggestion.reason === "string" ? suggestion.reason.trim() : "",
    }));

  if (suggestions.length === 0) {
    throw new Error("La IA no devolvió recomendaciones válidas");
  }
  return suggestions;
};
