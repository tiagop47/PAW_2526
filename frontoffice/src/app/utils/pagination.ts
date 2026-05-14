export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function paginate<T>(items: T[], currentPage: number, pageSize: number): T[] {
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getPageNumbers(totalItems: number, pageSize: number): number[] {
  const totalPages = getTotalPages(totalItems, pageSize);
  return Array.from({ length: totalPages }, (_, index) => index + 1);
}
