import {useState} from 'react';
import {api} from '../lib/api';
import { useBusinessContext } from '../business/BusinessContext';


export type AskKairosResponse = {
    sql: string;
    normalized: any;
    aiText: string;
    report_id: number;
    query_id: number;
    meta:{
        business_id: number;
        business_name: string;
        period: string;
        execution_time_ms: number;
    };
};

export function useAskKairos() {
    const {selectedBusiness} = useBusinessContext();
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<AskKairosResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function ask(question: string,options?: {start?: string, end?: string}) {

        // valider qun business est selectionné
        if (!selectedBusiness) {
            setError("No business selected");
            return;
        }
        // reinitialiser les etats avant le call
        setLoading(true);  // activer le loading
        setResponse(null); //Effacer les reponses precedentes
        setError(null); // Effacer les erreurs precedentes

        try {
            //construire le payload
            const payload : any= {
                business_id: selectedBusiness.id_business,  // requis par requireBusinessAccess (backend)
                question,
            };
            if(options?.start) payload.start = options.start;
            if(options?.end) payload.end = options.end;

            // faire le call a l'API
            const res = await api.post<AskKairosResponse>("/ai/ask", payload);
            setResponse(res.data); // stocker la reponse dans le state
        } catch (err: any) {
            // gestions des erreurs selon lt type
            const errorData = err?.response?.data;
            if (errorData?.error === "UNSAFE_SQL") {
                // SQL NON SAFE provenant de l'API
                setError("Unsafe SQL  detected in the response. The query was blocked for your security.");
            } else if (errorData?.error === "BUSINESS_NOT_FOUND") {
                setError("Business not found. Please select a valid business and try again.");
            } else {
                // Erreur generique
                setError(err?.response?.data?.error || err?.message || "Request failed");
            }
        } finally {
            setLoading(false); // desactiver le loading dans tous les cas
        }
    }

    function reset() {
        setResponse(null);
        setError(null);
        setLoading(false);
    }

    return { ask, reset,response, loading, error };
};
