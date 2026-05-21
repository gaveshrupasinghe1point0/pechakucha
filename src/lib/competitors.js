export function rankCompetitors(competitors = []) {
  return [...competitors].sort((a, b) => {
    if (b.vote_count !== a.vote_count) {
      return b.vote_count - a.vote_count;
    }

    const judgeDiff = Number(b.judge_score) - Number(a.judge_score);
    if (judgeDiff !== 0) {
      return judgeDiff;
    }

    return new Date(a.created_at) - new Date(b.created_at);
  });
}
