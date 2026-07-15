"use client";

import {
  Badge,
  Center,
  Group,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconFilter, IconSearch } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { exerciseAPI } from "@/lib/api";

/** Shape returned from GET /api/exercises (matches database row). */
interface ExerciseRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sport_id: string | null;
  measurement_type: string;
  equipment_needed: string[] | null;
  muscle_groups: string[] | null;
  difficulty_level: number | null;
  is_active: boolean;
  created_at: string;
}

/** Shape returned from GET /api/exercises/categories. */
interface CategoryData {
  categories: string[];
  muscle_groups: string[];
  equipment: string[];
  measurement_types: string[];
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Easy",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

const CATEGORY_COLORS: Record<string, string> = {
  olympic_lifts: "orange",
  squats: "blue",
  sprints: "green",
  jumps: "teal",
  sport_specific: "red",
  strength: "violet",
};

export function ExerciseLibrary() {
  // Filter state
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [measurementType, setMeasurementType] = useState<string | null>(null);

  // Data state
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch filter options on mount
  useEffect(() => {
    let cancelled = false;
    setCategoriesLoading(true);
    exerciseAPI
      .getCategories()
      .then((res) => {
        if (!cancelled) setCategoryData(res.data);
      })
      .catch(() => {
        // Silently handle -- filters will be empty
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch exercises with debounced search + filters
  const fetchExercises = useCallback(() => {
    setLoading(true);
    exerciseAPI
      .search({
        search: searchText || undefined,
        category: category || undefined,
        muscle_group: muscleGroup || undefined,
        equipment: equipment || undefined,
        measurement_type: measurementType || undefined,
        limit: 100,
      })
      .then((res) => {
        setExercises(res.data);
      })
      .catch(() => {
        setExercises([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchText, category, muscleGroup, equipment, measurementType]);

  // Debounce search text (300ms), but fire immediately for filter changes
  useEffect(() => {
    const timer = setTimeout(fetchExercises, 300);
    return () => clearTimeout(timer);
  }, [fetchExercises]);

  const formatCategory = (cat: string) =>
    cat
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <Table.Tr key={`skeleton-${i}`}>
        {Array.from({ length: 6 }).map((__, j) => (
          <Table.Td key={`skeleton-${i}-${j}`}>
            <Skeleton height={20} />
          </Table.Td>
        ))}
      </Table.Tr>
    ));

  const toSelectData = (items: string[] | undefined) =>
    (items ?? []).map((item) => ({
      value: item,
      label: formatCategory(item),
    }));

  return (
    <Stack gap="lg">
      <Title order={3}>Exercise Library</Title>

      {/* Search bar */}
      <TextInput
        placeholder="Search exercises by name..."
        leftSection={<IconSearch size={16} />}
        value={searchText}
        onChange={(e) => setSearchText(e.currentTarget.value)}
        size="md"
      />

      {/* Filter dropdowns */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Select
          placeholder="All Categories"
          label="Category"
          leftSection={<IconFilter size={14} />}
          data={toSelectData(categoryData?.categories)}
          value={category}
          onChange={setCategory}
          clearable
          disabled={categoriesLoading}
        />
        <Select
          placeholder="All Muscle Groups"
          label="Muscle Group"
          leftSection={<IconFilter size={14} />}
          data={toSelectData(categoryData?.muscle_groups)}
          value={muscleGroup}
          onChange={setMuscleGroup}
          clearable
          disabled={categoriesLoading}
        />
        <Select
          placeholder="All Equipment"
          label="Equipment"
          leftSection={<IconFilter size={14} />}
          data={toSelectData(categoryData?.equipment)}
          value={equipment}
          onChange={setEquipment}
          clearable
          disabled={categoriesLoading}
        />
        <Select
          placeholder="All Types"
          label="Measurement Type"
          leftSection={<IconFilter size={14} />}
          data={toSelectData(categoryData?.measurement_types)}
          value={measurementType}
          onChange={setMeasurementType}
          clearable
          disabled={categoriesLoading}
        />
      </SimpleGrid>

      {/* Results table */}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Category</Table.Th>
            <Table.Th>Muscle Groups</Table.Th>
            <Table.Th>Equipment</Table.Th>
            <Table.Th>Measurement</Table.Th>
            <Table.Th>Difficulty</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            renderSkeletonRows()
          ) : exercises.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Center py="xl">
                  <Text c="dimmed" fs="italic">
                    No exercises found. Try adjusting your search or filters.
                  </Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : (
            exercises.map((ex) => (
              <Table.Tr key={ex.id}>
                <Table.Td>
                  <Text fw={500}>{ex.name}</Text>
                  {ex.description && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {ex.description}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color={CATEGORY_COLORS[ex.category] ?? "gray"} size="sm">
                    {formatCategory(ex.category)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="wrap">
                    {(ex.muscle_groups ?? []).map((mg) => (
                      <Badge key={mg} variant="light" color="blue" size="xs">
                        {formatCategory(mg)}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="wrap">
                    {(ex.equipment_needed ?? []).map((eq) => (
                      <Badge key={eq} variant="light" color="gray" size="xs">
                        {formatCategory(eq)}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge variant="outline" size="sm">
                    {formatCategory(ex.measurement_type)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {ex.difficulty_level ? (
                    <Badge
                      variant="light"
                      color={
                        ex.difficulty_level <= 2
                          ? "green"
                          : ex.difficulty_level <= 3
                            ? "yellow"
                            : "red"
                      }
                      size="sm"
                    >
                      {DIFFICULTY_LABELS[ex.difficulty_level] ?? `Level ${ex.difficulty_level}`}
                    </Badge>
                  ) : (
                    <Text size="sm" c="dimmed">
                      --
                    </Text>
                  )}
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      {/* Result count */}
      {!loading && exercises.length > 0 && (
        <Text size="sm" c="dimmed" ta="right">
          Showing {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
        </Text>
      )}
    </Stack>
  );
}
