export const resourcesPerScene = (width: number, height: number) =>
  width < 760 ? 3 : height < 540 ? 4 : 5
export const recipeTravel = (count: number, width: number, height: number) =>
  Math.max(height * 0.6, (count - resourcesPerScene(width, height)) * height * 0.14)
