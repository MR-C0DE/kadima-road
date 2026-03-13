import React from "react";
import { Box, useTheme } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Lun", interventions: 12, revenu: 1800 },
  { day: "Mar", interventions: 15, revenu: 2200 },
  { day: "Mer", interventions: 18, revenu: 2600 },
  { day: "Jeu", interventions: 14, revenu: 2100 },
  { day: "Ven", interventions: 20, revenu: 2900 },
  { day: "Sam", interventions: 8, revenu: 1200 },
];

export default function PerformanceChart() {
  const theme = useTheme();

  return (
    <Box sx={{ width: "100%", height: 250 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="day"
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="interventions"
            stroke={theme.palette.primary.main}
            name="Interventions"
            strokeWidth={2}
            dot={{ fill: theme.palette.primary.main }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenu"
            stroke={theme.palette.secondary.main}
            name="Revenu ($)"
            strokeWidth={2}
            dot={{ fill: theme.palette.secondary.main }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
