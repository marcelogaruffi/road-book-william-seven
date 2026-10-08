import os
import re

# We need to make motorista-print.$slug.tsx and versao-motorista.$slug.tsx load the dynamic logos just like rb.$slug.tsx does.
# But actually, rb.$slug.tsx does this in its loader.

# I will write a node script to modify their loaders to fetch these logos.
