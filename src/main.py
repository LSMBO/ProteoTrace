import argparse
import subprocess

# Arguments communs
parser = argparse.ArgumentParser()
parser.add_argument('--tool', help='Selected tool', choices=['Proline', 'Ionbot', 'Maxquant'], required=True)
parser.add_argument('--name', help='Name of the run')
parser.add_argument('--result', help='File or directory path')
parser.add_argument('--database', help='Database fasta file')
parser.add_argument('--protein-descriptions', action='append', help='Protein description')
parser.add_argument('--runID', help='Run id')
args = parser.parse_args()

# Exécution en fonction de l'outil sélectionné
if args.tool == 'Maxquant':
    process_args = ['python'] + ['src/Maxquant/main.py']

elif args.tool == 'Proline':
    process_args = ['python'] + ['src/Proline/main.py']

elif args.tool == 'Ionbot':
    process_args = ['python'] + ['src/Ionbot/main.py']
    
# Vérifiez si l'utilisateur a spécifié --result et --database
if args.result and args.database:
    process_args.extend(['-r', args.result, '-f', args.database])

# Vérifiez si l'utilisateur a spécifié --protein-descriptions et --runID
if args.protein_descriptions and args.runID:
    process_args.extend(['-runID', args.runID])
    for description in args.protein_descriptions:
        process_args.extend(['--protein-descriptions', description])



# Lancer le processus
process = subprocess.Popen(process_args, stdout=subprocess.PIPE)
output, _ = process.communicate()
print(output.decode('utf-8'))
print("End of Python process")
