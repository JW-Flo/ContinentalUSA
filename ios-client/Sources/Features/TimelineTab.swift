import SwiftUI
import Foundation

struct TimelineTabView: View {
    @State private var anchors: [AnchorPoint] = []
    @State private var isLoading = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            VStack {
                if isLoading {
                    ProgressView("Loading timeline...")
                        .padding()
                } else if !errorMessage.isEmpty {
                    Text("Error: \(errorMessage)")
                        .foregroundColor(.red)
                        .padding()
                } else {
                    List(anchors) { anchor in
                        TimelineRowView(anchor: anchor)
                    }
                }
                
                Spacer()
            }
            .navigationTitle("Timeline")
            .onAppear {
                fetchAnchors()
                startPeriodicUpdates()
            }
        }
    }
    
    private func fetchAnchors() {
        isLoading = true
        errorMessage = ""
        
        // Using a placeholder URL - in production this would be configured
        guard let url = URL(string: "https://your-worker-domain.workers.dev/v1/anchors") else {
            errorMessage = "Invalid URL"
            isLoading = false
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            DispatchQueue.main.async {
                isLoading = false
                
                if let error = error {
                    errorMessage = error.localizedDescription
                    return
                }
                
                guard let data = data else {
                    errorMessage = "No data received"
                    return
                }
                
                do {
                    let decoder = JSONDecoder()
                    let fetchedAnchors = try decoder.decode([AnchorPoint].self, from: data)
                    self.anchors = fetchedAnchors
                } catch {
                    errorMessage = "Failed to decode data: \(error.localizedDescription)"
                }
            }
        }.resume()
    }
    
    private func startPeriodicUpdates() {
        // Schedule hourly updates
        Timer.scheduledTimer(withTimeInterval: 3600, repeats: true) { _ in
            fetchAnchors()
        }
    }
}

struct TimelineRowView: View {
    let anchor: AnchorPoint
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(anchor.name)
                    .font(.headline)
                
                Text("Day \(anchor.day)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text(formattedDate(anchor.date))
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let notes = anchor.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }
            
            Spacer()
            
            Button(action: {
                openInTeslaNavi()
            }) {
                Image(systemName: "location.fill")
                    .foregroundColor(.blue)
            }
        }
        .padding(.vertical, 4)
    }
    
    private func formattedDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        if let date = formatter.date(from: dateString) {
            formatter.dateStyle = .medium
            return formatter.string(from: date)
        }
        
        return dateString
    }
    
    private func openInTeslaNavi() {
        let teslaURL = "tesla://nav?addr=\(anchor.lat),\(anchor.lon)"
        
        if let url = URL(string: teslaURL) {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            } else {
                // Fallback to Maps if Tesla app not available
                let mapsURL = "http://maps.apple.com/?ll=\(anchor.lat),\(anchor.lon)&q=\(anchor.name)"
                if let fallbackURL = URL(string: mapsURL) {
                    UIApplication.shared.open(fallbackURL)
                }
            }
        }
    }
}

struct AnchorPoint: Identifiable, Codable {
    let id: String
    let name: String
    let lat: Double
    let lon: Double
    let date: String
    let day: Int
    let notes: String?
}

#if DEBUG
struct TimelineTabView_Previews: PreviewProvider {
    static var previews: some View {
        TimelineTabView()
    }
}
#endif