// F1 API Handler - Gestisce tutti i tipi di sessione
const F1API = {
    baseUrl: 'https://api.openf1.org/v1',
    
    // Ottieni tutte le sessioni disponibili
    async getAllSessions(year = 2025) {
        try {
            const response = await fetch(`${this.baseUrl}/sessions?year=${year}`);
            if (!response.ok) throw new Error('Errore API');
            return await response.json();
        } catch (error) {
            console.error('Errore getAllSessions:', error);
            return [];
        }
    },
    
    // Trova la sessione più recente (solo FP, Qualifica, Gara)
    async getCurrentSession() {
        const sessions = await this.getAllSessions();
        console.log('Tutte le sessioni:', sessions);
        
        if (!sessions || sessions.length === 0) {
            return null;
        }
        
        // Filtra solo: Practice (FP1, FP2, FP3), Qualifying, Race
        const validTypes = ['Practice', 'Qualifying', 'Race'];
        const validSessions = sessions.filter(s => {
            const type = s.session_type || '';
            const name = s.session_name || '';
            return validTypes.includes(type) || 
                   name.includes('Practice') || 
                   name.includes('Qualifying') || 
                   name.includes('Race');
        });
        
        console.log('Sessioni valide (FP/Qualifica/Gara):', validSessions);
        
        if (validSessions.length === 0) {
            return null;
        }
        
        // Prendi l'ultima sessione valida
        const currentSession = validSessions[validSessions.length - 1];
        console.log('Sessione corrente:', currentSession);
        
        return currentSession;
    },
    
    // Ottieni dati live di una sessione
    async getLiveData(sessionKey) {
        try {
            const [positions, laps, drivers, results] = await Promise.all([
                fetch(`${this.baseUrl}/position?session_key=${sessionKey}`).then(r => r.json()).catch(() => []),
                fetch(`${this.baseUrl}/laps?session_key=${sessionKey}`).then(r => r.json()).catch(() => []),
                fetch(`${this.baseUrl}/drivers?session_key=${sessionKey}`).then(r => r.json()).catch(() => []),
                fetch(`${this.baseUrl}/session_result?session_key=${sessionKey}&position<=3`).then(r => r.json()).catch(() => [])
            ]);
            
            return { positions, laps, drivers, results };
        } catch (error) {
            console.error('Errore getLiveData:', error);
            return { positions: [], laps: [], drivers: [], results: [] };
        }
    },
    
    // Ottieni dati meteo della sessione
    async getWeather(sessionKey) {
        try {
            const response = await fetch(`${this.baseUrl}/weather?session_key=${sessionKey}`);
            if (!response.ok) return null;
            const weather = await response.json();
            return weather[weather.length - 1]; // Ultimo aggiornamento
        } catch (error) {
            console.error('Errore getWeather:', error);
            return null;
        }
    },
    
    // Ottieni team radio
    async getTeamRadio(sessionKey) {
        try {
            const response = await fetch(`${this.baseUrl}/team_radio?session_key=${sessionKey}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Errore getTeamRadio:', error);
            return [];
        }
    },
    
    // Formatta il tempo (secondi -> MM:SS.mmm)
    formatTime(seconds) {
        if (!seconds || seconds <= 0) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(3);
        return `${mins}:${secs.padStart(6, '0')}`;
    },
    
    // Ottieni nome sessione leggibile
    getSessionName(session) {
        if (!session) return 'SESSIONE';
        
        const type = session.session_type || '';
        const name = session.session_name || '';
        
        if (type === 'Testing' || name.includes('Test')) {
            return 'TEST PRE-STAGIONALI';
        }
        if (type === 'Race') return 'GARA';
        if (type === 'Qualifying') return 'QUALIFICA';
        if (type === 'Sprint') return ' SPRINT';
        if (name.includes('Practice')) {
            if (name.includes('1')) return 'FP1';
            if (name.includes('2')) return 'FP2';
            if (name.includes('3')) return 'FP3';
        }
        
        return name || type || 'SESSIONE';
    }
};

// Esporta per uso globale
window.F1API = F1API;
