package dto

// GitHubStatusResponse represents the current GitHub synchronization status
type GitHubStatusResponse struct {
	Initialized  bool     `json:"initialized"`
	HasChanges   bool     `json:"hasChanges"`
	ChangedFiles []string `json:"changedFiles"`
	LastSyncTime string   `json:"lastSyncTime"`
	RemoteURL    string   `json:"remoteURL"`
	Branch       string   `json:"branch"`
}
