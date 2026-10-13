import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { BottomSheet, ORANGE, type MaterialIconName } from '@/components/ui';

export type SearchItem<T> = { key: string; title: string; subtitle?: string; value: T };

/**
 * Bottom sheet with a search box that queries as the user types (debounced),
 * shows results, and optionally offers a "create new" action.
 */
export function SearchSheet<T>({
  visible,
  title,
  placeholder,
  icon,
  minChars = 0,
  search,
  onSelect,
  onClose,
  createLabel,
  onCreate,
}: {
  visible: boolean;
  title: string;
  placeholder: string;
  icon: MaterialIconName;
  minChars?: number;
  search: (query: string) => Promise<SearchItem<T>[]>;
  onSelect: (value: T) => void | Promise<void>;
  onClose: () => void;
  createLabel?: string;
  onCreate?: (query: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setItems([]);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < minChars) {
      setItems([]);
      setLoading(false);
      return;
    }
    const currentRequest = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchRef.current(trimmed);
        if (currentRequest === requestId.current) {
          setItems(results);
          setFailed(false);
        }
      } catch {
        if (currentRequest === requestId.current) {
          setItems([]);
          setFailed(true);
        }
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, trimmed ? 300 : 0);
    return () => clearTimeout(timer);
  }, [minChars, query, visible]);

  async function choose(item: SearchItem<T>) {
    setSelecting(item.key);
    try {
      await onSelect(item.value);
      onClose();
    } finally {
      setSelecting(null);
    }
  }

  const tooShort = query.trim().length < minChars;

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <View className="h-[44px] flex-row items-center rounded-[11px] border border-[#ebe8e2] bg-white px-3">
        <Ionicons name="search-outline" size={17} color="#8a95a5" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#8a95a5"
          autoCorrect={false}
          autoFocus
          className="font-manrope-medium ml-2 flex-1 py-0 text-[12px] text-[#17253a]"
        />
        {loading ? <ActivityIndicator size="small" color={ORANGE} /> : null}
      </View>

      {createLabel && onCreate ? (
        <Pressable
          onPress={() => onCreate(query.trim())}
          className="mt-2.5 h-11 flex-row items-center rounded-[11px] border border-dashed border-[#ffbc7f] bg-[#fffaf4] px-3">
          <Ionicons name="add-circle-outline" size={19} color={ORANGE} />
          <Text className="font-manrope-bold ml-2 text-[12px] text-[#f27022]">{createLabel}</Text>
        </Pressable>
      ) : null}

      <ScrollView className="mt-2.5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {tooShort ? (
          <Text className="font-manrope-medium px-1 py-4 text-center text-[11px] text-[#617091]">
            Type at least {minChars} characters to search.
          </Text>
        ) : !loading && items.length === 0 ? (
          <Text className="font-manrope-medium px-1 py-4 text-center text-[11px] text-[#617091]">
            {failed ? 'Search failed. Check your connection and try again.' : query.trim() ? `No results for "${query.trim()}".` : 'No results yet.'}
          </Text>
        ) : (
          <View className="overflow-hidden rounded-[14px] border border-[#ebe8e1] bg-white">
            {items.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={() => choose(item)}
                disabled={Boolean(selecting)}
                className={`flex-row items-center px-3.5 py-3 active:bg-[#faf9f6] ${index ? 'border-t border-[#efede8]' : ''}`}>
                <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-[#fff0e5]">
                  <MaterialCommunityIcons name={icon} size={18} color={ORANGE} />
                </View>
                <View className="ml-3 min-w-0 flex-1">
                  <Text numberOfLines={1} className="font-manrope-bold text-[13px] text-[#26364b]">{item.title}</Text>
                  {item.subtitle ? (
                    <Text numberOfLines={1} className="font-manrope-medium mt-0.5 text-[10px] text-[#8290a1]">{item.subtitle}</Text>
                  ) : null}
                </View>
                {selecting === item.key ? <ActivityIndicator size="small" color={ORANGE} /> : <Ionicons name="chevron-forward" size={16} color="#8a95a5" />}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}
