# Python Backend - Graph Generation Service
# This service receives dashboard plans and generates actual graph images

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import io
import base64
import json
from typing import Dict, List, Any
import numpy as np

app = Flask(__name__)
CORS(app)  # Allow requests from Next.js frontend

# ==========================================
# DARK THEME - Matching App Design (Black/Purple)
# ==========================================
# App uses DARK THEME: black background with purple/blue accents
# Charts MUST use dark backgrounds to match

sns.set_style("dark")
plt.rcParams['figure.figsize'] = (10, 6)  # Fixed size for uniform appearance
plt.rcParams['font.size'] = 11
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.titleweight'] = 'bold'
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10
plt.rcParams['legend.fontsize'] = 10
plt.rcParams['legend.framealpha'] = 0.9

# DARK THEME - Match website (black/purple/dark gray)
plt.rcParams['figure.facecolor'] = '#1a1a2e'  # Dark navy/black
plt.rcParams['axes.facecolor'] = '#16213e'    # Dark blue-black for charts
plt.rcParams['axes.edgecolor'] = '#4a5568'    # Gray border
plt.rcParams['axes.linewidth'] = 1.5
plt.rcParams['grid.color'] = '#374151'        # Dark gray grid
plt.rcParams['grid.alpha'] = 0.3
plt.rcParams['grid.linestyle'] = '--'
plt.rcParams['grid.linewidth'] = 0.8

# Text colors for dark theme
plt.rcParams['text.color'] = '#e5e7eb'        # Light gray text
plt.rcParams['axes.labelcolor'] = '#e5e7eb'   # Light gray labels
plt.rcParams['xtick.color'] = '#e5e7eb'       # Light gray ticks
plt.rcParams['ytick.color'] = '#e5e7eb'       # Light gray ticks

# Gradient color palette matching app theme (blue-500 → purple-600 → pink-500)
GRADIENT_COLORS = [
    '#3b82f6',  # blue-500 (primary)
    '#9333ea',  # purple-600 (secondary)
    '#ec4899',  # pink-500 (accent)
    '#06b6d4',  # cyan-500
    '#8b5cf6',  # purple-500
    '#f43f5e',  # rose-500
    '#0ea5e9',  # sky-500
    '#d946ef',  # fuchsia-500
    '#10b981',  # emerald-500
    '#f59e0b',  # amber-500
]


def generate_bar_chart(data: pd.DataFrame, x_col: str, y_col: str, title: str, aggregation: str = 'sum'):
    """Generate a dark-themed bar chart"""
    plt.figure(figsize=(10, 6))

    if aggregation == 'sum':
        df_agg = data.groupby(x_col)[y_col].sum().reset_index()
    elif aggregation == 'avg':
        df_agg = data.groupby(x_col)[y_col].mean().reset_index()
    elif aggregation == 'count':
        df_agg = data.groupby(x_col)[y_col].count().reset_index()
    else:
        df_agg = data.groupby(x_col)[y_col].sum().reset_index()

    # Use vibrant gradient colors for dark theme
    colors = [GRADIENT_COLORS[i % len(GRADIENT_COLORS)] for i in range(len(df_agg))]
    bars = plt.bar(df_agg[x_col], df_agg[y_col], color=colors,
                   edgecolor='#1a1a2e', linewidth=1.5, alpha=0.9)

    # Dark theme styling with light text
    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(x_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel(y_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.xticks(rotation=45, ha='right', color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.grid(axis='y', alpha=0.3, linestyle='--', linewidth=0.8)

    plt.tight_layout()
    return save_plot_to_base64()


def generate_line_chart(data: pd.DataFrame, x_col: str, y_col: str, title: str):
    """Generate a dark-themed line chart"""
    plt.figure(figsize=(10, 6))

    df_sorted = data.sort_values(x_col)

    # Use vibrant purple for line, blue for markers (dark theme)
    plt.plot(df_sorted[x_col], df_sorted[y_col], marker='o', linewidth=3,
             color='#9333ea', markersize=8, markerfacecolor='#3b82f6',
             markeredgecolor='#1a1a2e', markeredgewidth=2, alpha=0.9)

    # Fill area with purple gradient
    plt.fill_between(df_sorted[x_col], df_sorted[y_col], alpha=0.2, color='#9333ea')

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(x_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel(y_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.xticks(rotation=45, ha='right', color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.grid(True, alpha=0.3, linestyle='--', linewidth=0.8)
    plt.tight_layout()

    return save_plot_to_base64()


def generate_pie_chart(data: pd.DataFrame, x_col: str, y_col: str, title: str):
    """Generate a dark-themed pie chart"""
    plt.figure(figsize=(10, 6))

    df_agg = data.groupby(x_col)[y_col].sum().reset_index()

    # Use vibrant gradient colors for dark theme
    colors = [GRADIENT_COLORS[i % len(GRADIENT_COLORS)] for i in range(len(df_agg))]

    plt.pie(df_agg[y_col], labels=df_agg[x_col], autopct='%1.1f%%', startangle=90,
            colors=colors, wedgeprops={'edgecolor': '#1a1a2e', 'linewidth': 2},
            textprops={'fontsize': 10, 'weight': 'bold', 'color': '#e5e7eb'})
    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.axis('equal')
    plt.tight_layout()

    return save_plot_to_base64()


def generate_histogram(data: pd.DataFrame, y_col: str, title: str):
    """Generate a dark-themed histogram"""
    plt.figure(figsize=(10, 6))

    # Use vibrant blue for dark theme
    plt.hist(data[y_col].dropna(), bins=30, edgecolor='#1a1a2e', linewidth=1.5,
             color='#3b82f6', alpha=0.9)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(y_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel('Frequency', fontsize=12, color='#e5e7eb', fontweight='600')
    plt.xticks(color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.grid(True, alpha=0.3, axis='y', linestyle='--', linewidth=0.8)
    plt.tight_layout()

    return save_plot_to_base64()


def generate_scatter_plot(data: pd.DataFrame, x_col: str, y_col: str, title: str):
    """Generate a dark-themed scatter plot"""
    plt.figure(figsize=(10, 6))

    plt.scatter(data[x_col], data[y_col], alpha=0.7, s=60, color='#3b82f6', edgecolors='#9333ea', linewidth=1.5)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(x_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel(y_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.xticks(color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.grid(True, alpha=0.3, linestyle='--', linewidth=0.8)
    plt.tight_layout()

    return save_plot_to_base64()


def generate_boxplot(data: pd.DataFrame, y_col: str, x_col: str, title: str):
    """Generate a dark-themed box plot"""
    plt.figure(figsize=(10, 6))

    if x_col:
        sns.boxplot(data=data, x=x_col, y=y_col, palette=GRADIENT_COLORS)
        plt.xticks(rotation=45, ha='right', color='#e5e7eb')
    else:
        sns.boxplot(data=data, y=y_col, palette=GRADIENT_COLORS)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(x_col.title() if x_col else '', fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel(y_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.yticks(color='#e5e7eb')
    plt.tight_layout()

    return save_plot_to_base64()


def generate_heatmap(data: pd.DataFrame, title: str):
    """Generate a dark-themed heatmap (correlation matrix)"""
    plt.figure(figsize=(10, 6))

    # Select only numeric columns
    numeric_data = data.select_dtypes(include=[np.number])
    correlation = numeric_data.corr()

    sns.heatmap(correlation, annot=True, fmt='.2f', cmap='viridis', center=0,
                square=True, linewidths=1, cbar_kws={"shrink": 0.8},
                annot_kws={'color': '#e5e7eb'})

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xticks(color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.tight_layout()

    return save_plot_to_base64()


def generate_kpi_card(data: pd.DataFrame, y_col: str, title: str, aggregation: str = 'sum'):
    """Generate a dark-themed KPI card"""
    plt.figure(figsize=(10, 6))

    if aggregation == 'sum':
        value = data[y_col].sum()
    elif aggregation == 'avg':
        value = data[y_col].mean()
    elif aggregation == 'count':
        value = len(data[y_col])
    elif aggregation == 'min':
        value = data[y_col].min()
    elif aggregation == 'max':
        value = data[y_col].max()
    else:
        value = data[y_col].sum()

    # Format value with appropriate precision
    if abs(value) >= 1000000:
        display_value = f'{value/1000000:.2f}M'
    elif abs(value) >= 1000:
        display_value = f'{value/1000:.2f}K'
    elif abs(value) >= 1:
        display_value = f'{value:,.2f}'
    else:
        display_value = f'{value:.4f}'

    # Use vibrant purple for KPI (dark theme)
    plt.text(0.5, 0.55, display_value,
             ha='center', va='center', fontsize=52, fontweight='bold', color='#9333ea')
    plt.text(0.5, 0.25, title,
             ha='center', va='center', fontsize=16, color='#e5e7eb', fontweight='600')
    plt.xlim(0, 1)
    plt.ylim(0, 1)
    plt.axis('off')
    plt.tight_layout()

    return save_plot_to_base64()


def generate_area_chart(data: pd.DataFrame, x_col: str, y_col: str, title: str, aggregation: str = 'sum'):
    """Generate a dark-themed area chart"""
    plt.figure(figsize=(10, 6))

    df_sorted = data.sort_values(x_col)

    if aggregation == 'sum':
        df_agg = df_sorted.groupby(x_col)[y_col].sum().reset_index()
    elif aggregation == 'avg':
        df_agg = df_sorted.groupby(x_col)[y_col].mean().reset_index()
    else:
        df_agg = df_sorted.groupby(x_col)[y_col].sum().reset_index()

    plt.fill_between(df_agg[x_col], df_agg[y_col], color=GRADIENT_COLORS[0], alpha=0.6)
    plt.plot(df_agg[x_col], df_agg[y_col], color=GRADIENT_COLORS[0], linewidth=3, alpha=0.9)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(x_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel(y_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.xticks(rotation=45, ha='right', color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.grid(axis='y', alpha=0.3, linestyle='--', linewidth=0.8)

    plt.tight_layout()
    return save_plot_to_base64()


def generate_stacked_area_chart(data: pd.DataFrame, x_col: str, y_cols: list, title: str):
    """Generate a dark-themed stacked area chart"""
    plt.figure(figsize=(10, 6))

    df_sorted = data.sort_values(x_col)

    if isinstance(y_cols, str):
        y_cols = [y_cols]

    y_data = []
    for col in y_cols[:5]:  # Limit to 5 series for clarity
        if col in df_sorted.columns:
            y_data.append(df_sorted[col].fillna(0))

    if y_data:
        plt.stackplot(df_sorted[x_col], *y_data, colors=GRADIENT_COLORS[:len(y_data)], alpha=0.8)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(x_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel('Value', fontsize=12, color='#e5e7eb', fontweight='600')
    plt.xticks(rotation=45, ha='right', color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.grid(axis='y', alpha=0.3, linestyle='--', linewidth=0.8)

    plt.tight_layout()
    return save_plot_to_base64()


def generate_bubble_chart(data: pd.DataFrame, x_col: str, y_col: str, size_col: str, title: str):
    """Generate a dark-themed bubble chart"""
    plt.figure(figsize=(10, 6))

    # Normalize bubble sizes
    sizes = data[size_col].fillna(0)
    sizes_normalized = (sizes - sizes.min()) / (sizes.max() - sizes.min() + 1) * 2000 + 100

    plt.scatter(data[x_col], data[y_col], s=sizes_normalized,
                color=GRADIENT_COLORS[0], alpha=0.6, edgecolors=GRADIENT_COLORS[1], linewidth=2)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(x_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel(y_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.xticks(color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.grid(alpha=0.3, linestyle='--', linewidth=0.8)

    plt.tight_layout()
    return save_plot_to_base64()


def generate_donut_chart(data: pd.DataFrame, x_col: str, y_col: str, title: str):
    """Generate a dark-themed donut chart"""
    plt.figure(figsize=(10, 6))

    df_agg = data.groupby(x_col)[y_col].sum().reset_index()
    df_agg = df_agg.nlargest(8, y_col)  # Top 8 categories

    colors = [GRADIENT_COLORS[i % len(GRADIENT_COLORS)] for i in range(len(df_agg))]

    wedges, texts, autotexts = plt.pie(df_agg[y_col], labels=df_agg[x_col],
                                        autopct='%1.1f%%', startangle=90,
                                        colors=colors, textprops={'color': '#e5e7eb', 'fontsize': 10},
                                        wedgeprops={'edgecolor': '#1a1a2e', 'linewidth': 2})

    # Create donut hole
    center_circle = plt.Circle((0, 0), 0.70, fc='#1a1a2e')
    fig = plt.gcf()
    fig.gca().add_artist(center_circle)

    for autotext in autotexts:
        autotext.set_color('#e5e7eb')
        autotext.set_fontweight('bold')

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.tight_layout()
    return save_plot_to_base64()


def generate_waterfall_chart(data: pd.DataFrame, x_col: str, y_col: str, title: str):
    """Generate a dark-themed waterfall chart"""
    plt.figure(figsize=(10, 6))

    df_sorted = data.sort_values(x_col)
    values = df_sorted[y_col].values
    cumulative = np.cumsum(values)

    # Create waterfall
    colors = [GRADIENT_COLORS[0] if v >= 0 else GRADIENT_COLORS[2] for v in values]

    x_pos = np.arange(len(values))
    plt.bar(x_pos, values, bottom=np.concatenate(([0], cumulative[:-1])),
            color=colors, alpha=0.8, edgecolor='#1a1a2e', linewidth=1.5)

    # Add connecting lines
    for i in range(len(values) - 1):
        plt.plot([i + 0.4, i + 0.6], [cumulative[i], cumulative[i]],
                 color='#e5e7eb', linestyle='--', linewidth=1, alpha=0.6)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(x_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel(y_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.xticks(x_pos, df_sorted[x_col], rotation=45, ha='right', color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.grid(axis='y', alpha=0.3, linestyle='--', linewidth=0.8)

    plt.tight_layout()
    return save_plot_to_base64()


def generate_violin_plot(data: pd.DataFrame, y_col: str, x_col: str, title: str):
    """Generate a dark-themed violin plot"""
    plt.figure(figsize=(10, 6))

    # Prepare data for violin plot
    categories = data[x_col].unique()[:8]  # Limit to 8 categories
    plot_data = [data[data[x_col] == cat][y_col].dropna() for cat in categories]

    parts = plt.violinplot(plot_data, positions=range(len(categories)),
                           showmeans=True, showextrema=True)

    # Style violin plots
    for pc in parts['bodies']:
        pc.set_facecolor(GRADIENT_COLORS[0])
        pc.set_alpha(0.7)
        pc.set_edgecolor('#e5e7eb')

    for partname in ('cbars', 'cmins', 'cmaxes', 'cmeans'):
        if partname in parts:
            parts[partname].set_edgecolor('#e5e7eb')
            parts[partname].set_linewidth(2)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlabel(x_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.ylabel(y_col.title(), fontsize=12, color='#e5e7eb', fontweight='600')
    plt.xticks(range(len(categories)), categories, rotation=45, ha='right', color='#e5e7eb')
    plt.yticks(color='#e5e7eb')
    plt.grid(axis='y', alpha=0.3, linestyle='--', linewidth=0.8)

    plt.tight_layout()
    return save_plot_to_base64()


def generate_treemap(data: pd.DataFrame, x_col: str, y_col: str, title: str):
    """Generate a dark-themed treemap using squarify"""
    try:
        import squarify
    except ImportError:
        # Fallback to pie chart if squarify not available
        return generate_pie_chart(data, x_col, y_col, title)

    plt.figure(figsize=(10, 6))

    df_agg = data.groupby(x_col)[y_col].sum().reset_index()
    df_agg = df_agg.nlargest(12, y_col)  # Top 12 categories

    sizes = df_agg[y_col].values
    labels = [f"{cat}\n{val:.0f}" for cat, val in zip(df_agg[x_col], df_agg[y_col])]
    colors = [GRADIENT_COLORS[i % len(GRADIENT_COLORS)] for i in range(len(df_agg))]

    squarify.plot(sizes=sizes, label=labels, color=colors, alpha=0.8,
                  text_kwargs={'color': '#e5e7eb', 'fontsize': 9, 'weight': 'bold'},
                  edgecolor='#1a1a2e', linewidth=2)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.axis('off')
    plt.tight_layout()
    return save_plot_to_base64()


def generate_radar_chart(data: pd.DataFrame, categories: list, values_col: str, title: str):
    """Generate a dark-themed radar/spider chart"""
    plt.figure(figsize=(10, 6))

    # Prepare data
    if isinstance(categories, str):
        categories = [categories]

    df_subset = data[categories + [values_col]].head(8)  # Limit to 8 axes

    angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
    values = df_subset[values_col].values.tolist()

    # Close the plot
    angles += angles[:1]
    values += values[:1]

    ax = plt.subplot(111, projection='polar')
    ax.plot(angles, values, 'o-', linewidth=2, color=GRADIENT_COLORS[0])
    ax.fill(angles, values, alpha=0.25, color=GRADIENT_COLORS[0])
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, color='#e5e7eb')
    ax.set_yticklabels([])
    ax.grid(True, color='#374151', alpha=0.5)

    plt.title(title, fontsize=14, fontweight='bold', pad=20, color='#e5e7eb')
    plt.tight_layout()
    return save_plot_to_base64()


def generate_funnel_chart(data: pd.DataFrame, x_col: str, y_col: str, title: str):
    """Generate a dark-themed funnel chart"""
    plt.figure(figsize=(10, 6))

    df_sorted = data.sort_values(y_col, ascending=False).head(8)

    values = df_sorted[y_col].values
    labels = df_sorted[x_col].values
    max_val = values.max()

    colors = [GRADIENT_COLORS[i % len(GRADIENT_COLORS)] for i in range(len(values))]

    for i, (label, value) in enumerate(zip(labels, values)):
        width = value / max_val
        plt.barh(i, width, height=0.8, color=colors[i], alpha=0.8,
                 edgecolor='#1a1a2e', linewidth=2)
        plt.text(width / 2, i, f'{label}: {value:.0f}',
                 ha='center', va='center', color='#e5e7eb', fontweight='bold', fontsize=10)

    plt.title(title, fontsize=14, fontweight='bold', pad=15, color='#e5e7eb')
    plt.xlim(0, 1)
    plt.axis('off')
    plt.tight_layout()
    return save_plot_to_base64()


def generate_gauge_chart(data: pd.DataFrame, y_col: str, title: str, aggregation: str = 'sum'):
    """Generate a dark-themed gauge/dial chart"""
    plt.figure(figsize=(10, 6))

    # Calculate value
    if aggregation == 'sum':
        value = data[y_col].sum()
    elif aggregation == 'avg':
        value = data[y_col].mean()
    elif aggregation == 'max':
        value = data[y_col].max()
    else:
        value = data[y_col].sum()

    max_value = data[y_col].max() * 1.2  # Set max to 120% of max value
    percentage = (value / max_value) * 100 if max_value > 0 else 0

    # Create gauge
    ax = plt.subplot(111, projection='polar')
    ax.set_theta_zero_location('N')
    ax.set_theta_direction(-1)
    ax.set_thetamin(0)
    ax.set_thetamax(180)

    # Background arc
    theta = np.linspace(0, np.pi, 100)
    r = np.ones_like(theta)
    ax.plot(theta, r, color='#374151', linewidth=20, alpha=0.3)

    # Value arc
    theta_value = np.linspace(0, np.pi * (percentage / 100), 100)
    r_value = np.ones_like(theta_value)

    color = GRADIENT_COLORS[0] if percentage < 70 else GRADIENT_COLORS[2]
    ax.plot(theta_value, r_value, color=color, linewidth=20, alpha=0.9)

    # Needle
    needle_angle = np.pi * (1 - percentage / 100)
    ax.plot([needle_angle, needle_angle], [0, 0.9], color='#e5e7eb', linewidth=3)

    ax.set_ylim(0, 1)
    ax.set_yticks([])
    ax.set_xticks([])
    ax.spines['polar'].set_visible(False)

    # Add value text
    plt.text(0, -0.3, f'{value:.1f}', ha='center', va='center',
             fontsize=24, color='#e5e7eb', fontweight='bold',
             transform=ax.transData)
    plt.text(0, -0.5, title, ha='center', va='center',
             fontsize=12, color='#e5e7eb', fontweight='600',
             transform=ax.transData)

    plt.tight_layout()
    return save_plot_to_base64()


def save_plot_to_base64():
    """Save the current plot to base64 string with dark theme"""
    buf = io.BytesIO()
    # Higher DPI for better quality, tight layout for uniform sizing
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight',
                facecolor='#1a1a2e', edgecolor='none')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()
    return img_base64


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "graph-generation"})


@app.route('/generate-graphs', methods=['POST'])
def generate_graphs():
    """
    Main endpoint to generate graphs from dashboard plan

    Expected payload:
    {
        "data": [...],  # CSV data as list of dicts
        "charts": [     # Chart specifications from AI
            {
                "id": "chart-1",
                "title": "Revenue by Region",
                "type": "bar",
                "mapping": {
                    "x": "region",
                    "y": "revenue",
                    "aggregation": "sum"
                }
            }
        ]
    }

    Returns:
    {
        "success": true,
        "charts": [
            {
                "id": "chart-1",
                "image": "base64_encoded_image",
                "title": "Revenue by Region"
            }
        ]
    }
    """
    try:
        payload = request.json
        data_list = payload.get('data', [])
        chart_specs = payload.get('charts', [])

        if not data_list or not chart_specs:
            return jsonify({
                "success": False,
                "error": "Missing data or chart specifications"
            }), 400

        # Convert data to pandas DataFrame
        df = pd.DataFrame(data_list)

        # Generate each chart
        generated_charts = []

        for chart in chart_specs:
            chart_id = chart.get('id')
            chart_type = chart.get('type')
            title = chart.get('title', 'Untitled Chart')
            mapping = chart.get('mapping', {})

            x_col = mapping.get('x')
            y_col = mapping.get('y')
            aggregation = mapping.get('aggregation', 'sum')

            try:
                # Generate chart based on type
                if chart_type in ['bar', 'column']:
                    image_base64 = generate_bar_chart(df, x_col, y_col, title, aggregation)

                elif chart_type == 'line':
                    image_base64 = generate_line_chart(df, x_col, y_col, title)

                elif chart_type == 'pie':
                    image_base64 = generate_pie_chart(df, x_col, y_col, title)

                elif chart_type == 'donut':
                    image_base64 = generate_donut_chart(df, x_col, y_col, title)

                elif chart_type == 'histogram':
                    image_base64 = generate_histogram(df, y_col, title)

                elif chart_type == 'scatter':
                    image_base64 = generate_scatter_plot(df, x_col, y_col, title)

                elif chart_type == 'boxplot':
                    image_base64 = generate_boxplot(df, y_col, x_col, title)

                elif chart_type == 'heatmap':
                    image_base64 = generate_heatmap(df, title)

                elif chart_type in ['kpi', 'card']:
                    image_base64 = generate_kpi_card(df, y_col, title, aggregation)

                elif chart_type == 'area':
                    image_base64 = generate_area_chart(df, x_col, y_col, title, aggregation)

                elif chart_type == 'stacked_area':
                    y_cols = mapping.get('y_cols', [y_col])
                    image_base64 = generate_stacked_area_chart(df, x_col, y_cols, title)

                elif chart_type == 'bubble':
                    size_col = mapping.get('size', y_col)
                    image_base64 = generate_bubble_chart(df, x_col, y_col, size_col, title)

                elif chart_type == 'waterfall':
                    image_base64 = generate_waterfall_chart(df, x_col, y_col, title)

                elif chart_type == 'violin':
                    image_base64 = generate_violin_plot(df, y_col, x_col, title)

                elif chart_type == 'treemap':
                    image_base64 = generate_treemap(df, x_col, y_col, title)

                elif chart_type == 'radar':
                    categories = mapping.get('categories', [x_col])
                    image_base64 = generate_radar_chart(df, categories, y_col, title)

                elif chart_type == 'funnel':
                    image_base64 = generate_funnel_chart(df, x_col, y_col, title)

                elif chart_type == 'gauge':
                    image_base64 = generate_gauge_chart(df, y_col, title, aggregation)

                else:
                    # Unsupported chart type, skip
                    continue

                generated_charts.append({
                    "id": chart_id,
                    "title": title,
                    "image": image_base64,
                    "type": chart_type
                })

            except Exception as e:
                print(f"Error generating chart {chart_id}: {str(e)}")
                # Skip failed charts
                continue

        return jsonify({
            "success": True,
            "charts": generated_charts,
            "total": len(generated_charts)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == '__main__':
    print("🐍 Python Graph Generation Service Starting...")
    print("📊 Supported chart types: bar, column, line, area, stacked_area, pie, donut, histogram, scatter, bubble, boxplot, violin, heatmap, treemap, waterfall, funnel, radar, gauge, kpi")
    print("🚀 Server running on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
