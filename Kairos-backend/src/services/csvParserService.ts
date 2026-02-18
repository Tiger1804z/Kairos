

interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}


export function parseCsvBuffer(buffer: Buffer): CsvParseResult {
    const content = buffer.toString('utf-8').trim();
    const lines = content.split(/\r?\n/);

    if (lines.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins un header et une ligne de données.');
    }

    const headers =  parseCsvLine(lines[0]!);
    const rows :  Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i]!.trim();
        if (!line) continue; // Ignorer les lignes vides

        const values = parseCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ?? "";
        });
        rows.push(row);
    }

    return {
        headers,
        rows,
        totalRows: rows.length
    };
}

export function getPreview(parseResult: CsvParseResult, limit = 10): CsvParseResult {
  return {
    headers: parseResult.headers,
    rows: parseResult.rows.slice(0, limit),
    totalRows: parseResult.totalRows,
  };
}


function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuotes){
            if (char === '"' && line[i + 1] === '"') {
                current += '"'; // Gérer les guillemets échappés
                i++; // Ignorer le guillemet suivant
            }else if (char === '"') {
                inQuotes = false; // Fin d'une section entre guillemets
            }else {
                current += char; // Ajouter le caractère à la valeur courante
            }
        } else {
            if (char === '"') {
                inQuotes = true; // Début d'une section entre guillemets
            } else if (char === ','|| char === ";") {
                values.push(current.trim());
                current = ''; // Réinitialiser pour la prochaine valeur
            } else {
                current += char; // Ajouter le caractère à la valeur courante
            }

        }
    }
    values.push(current.trim()); // Ajouter la dernière valeur
    return values;
}