export async function downloadFile(url: string) {
    return await fetch(url);
}