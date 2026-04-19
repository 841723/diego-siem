package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

type Log struct {
	Service string `json:"service"`
	Message string `json:"message"`
	Level   string `json:"level"`
}

var logs []Log
var mu sync.Mutex

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func receiveLog(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var l Log
	if err := json.NewDecoder(r.Body).Decode(&l); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	mu.Lock()
	logs = append(logs, l)
	mu.Unlock()

	log.Printf("[LOG] %+v\n", l)

	w.WriteHeader(http.StatusOK)
}

func getLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	log.Printf("[GET LOGS] Total logs: %d\n", len(logs))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func main() {
	http.HandleFunc("/logs", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			receiveLog(w, r)
		case http.MethodGet:
			getLogs(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	http.HandleFunc("/logs/all", enableCORS(getLogs))

	log.Println("Backend running on :8080")
	http.ListenAndServe(":8080", nil)
}
