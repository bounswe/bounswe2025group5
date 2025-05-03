import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Switch, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';

const API_BASE = 'http://localhost:8080';

type Challenge = {
  name: string;
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  wasteType: string;
};

export default function ChallengesScreen() {
  const navigation = useNavigation<any>();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [attended, setAttended] = useState<Challenge[]>([]);
  const [showAttendedOnly, setShowAttendedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpand = (name: string) => {
    setExpanded(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API_BASE}/api/challenges`).then(res => res.json()),
      fetch(`${API_BASE}/api/challenges/attended_challenges`).then(res => res.json()),
    ])
      .then(([all, user]) => {
        setChallenges(all);
        setAttended(user);
      })
      .catch(err => setError(err.message || 'Error fetching challenges'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.center} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ThemedText type="default">{error}</ThemedText>
        <Button title="Retry" onPress={fetchData} />
      </View>
    );
  }

  const dataToShow = showAttendedOnly ? attended : challenges;

  if (dataToShow.length === 0) {
    return (
      <View style={styles.center}>
        <ThemedText type="default">No challenges found.</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <ThemedText type="default">Attended only</ThemedText>
        <Switch
          value={showAttendedOnly}
          onValueChange={setShowAttendedOnly}
        />
      </View>
      <FlatList
        data={dataToShow}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => toggleExpand(item.name)}>
              <View style={styles.header}>
                <ThemedText type="title">{item.name}</ThemedText>
                <ThemedText type="default">
                  {item.startDate} - {item.endDate}
                </ThemedText>
              </View>
            </TouchableOpacity>
            {expanded.includes(item.name) && (
              <View style={styles.details}>
                <ThemedText type="default">{item.description}</ThemedText>
                <ThemedText type="default">Amount: {item.amount}</ThemedText>
                <ThemedText type="default">Type: {item.wasteType}</ThemedText>
                <Button
                  title="View Leaderboard"
                  onPress={() => navigation.navigate('challenge_leaderboard')}
                />
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
  },
  header: { marginBottom: 8 },
  details: { marginTop: 8 },
});
