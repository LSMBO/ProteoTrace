import argparse
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--name', help='Name input', required=True)
parser.add_argument('--tool', help='Selected tool', choices=['Proline', 'Ionbot', 'Maxquant'], required=True)
parser.add_argument('--result', help='File or directory path', required=True)
parser.add_argument('--database', help='Database fasta file', required=True)

args = parser.parse_args()

print(f"You run {args.name} with {args.tool}")
print(f"Selected file/directory: {args.result}\n")

if args.tool == 'Maxquant':
    process = subprocess.Popen(['python', 'src/Maxquant/main.py', '-r', args.result, '-f', args.database], stdout=subprocess.PIPE)
    
elif args.tool == 'Proline':
    process = subprocess.Popen(['python', 'src/Proline/main.py', '-r', args.result, '-f', args.database], stdout=subprocess.PIPE)

elif args.tool == 'Ionbot':
    process = subprocess.Popen(['python', 'src/Ionbot/main.py', '-r', args.result, '-f', args.database], stdout=subprocess.PIPE)


output, _ = process.communicate()
print(output.decode('utf-8'))
print("End of big main")


