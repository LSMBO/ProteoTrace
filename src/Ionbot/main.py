from Ionbot import Ionbot
import pickle
import argparse
import random, string
from Bio import SeqIO
import os

parser = argparse.ArgumentParser()
parser.add_argument('-r', help='Ionbot result folder (txt folder)')
parser.add_argument('-f', help='Database used in the identification search')
parser.add_argument('-runID', help='Run id')
parser.add_argument('--protein-descriptions', help='Protein id', action='append')
parser.add_argument('--tmp-path', help='Path to the temporary directory')

args = parser.parse_args()

def strip_list(input_list):
    new_list = []
    for i in input_list:
        new_list.append(i[1:-2])
    return new_list

def description_to_id(protein_description):
    return protein_description.split(' ')[0]

if (args.r and args.f):
    result_folder = args.r
    fasta_file = args.f
    random_suffix = ''.join(random.choices(string.digits, k=4))
    output_file_pkl = os.path.join(args.tmp_path, f"Ionbot_proteotrace_{random_suffix}.pkl")
    output_file_txt = os.path.join(args.tmp_path, f"Ionbot_proteotrace_protein_list_{random_suffix}.txt")

    ionbot = Ionbot(result_folder, fasta_file)
    with open(output_file_pkl, 'wb') as pkl_file:
        pickle.dump(ionbot, pkl_file)
        
    protein_description_all = [record.description for record in SeqIO.parse(fasta_file, "fasta")]
    print(f"RUN_ID={random_suffix}")
    
    with open(output_file_txt, 'w') as output_file:
        for protein_description in protein_description_all:
            output_file.write(f"{protein_description}\n")
            
elif (args.runID):
    args.runID = args.runID[:-2]
    args.protein_descriptions = strip_list(args.protein_descriptions)
    pkl_file = os.path.join(args.tmp_path, f"Ionbot_proteotrace_{args.runID}.pkl")
    with open(pkl_file, 'rb') as pkl_file:
        ionbot = pickle.load(pkl_file)
    result_folder = ionbot.result_folder
    fasta_file = ionbot.fasta_file
    ionbot = Ionbot(result_folder, fasta_file, args.protein_descriptions)
    
    for protein_description in args.protein_descriptions:
        found = False
        for ionbot_protein in ionbot.proteins:
            if ionbot_protein.description == protein_description:
                found = True
                ionbot_protein_transformed_id = ionbot_protein.id.replace('|', '##')
                coverage_file=os.path.join(args.tmp_path, f"Ionbot_proteotrace_{args.runID}_{ionbot_protein_transformed_id}_coverage.txt")
                ionbot_protein.get_sequence_coverage(coverage_file)
                print(f"LOG=PROTEIN_ID={description_to_id(protein_description)}@@IDENTIFIED=TRUE")
                print(f"LOG=PROTEIN_ID={description_to_id(protein_description)}@@COVERAGE_FILE={coverage_file}")
                break
        if not found:
            print(f"LOG=PROTEIN_ID={description_to_id(protein_description)}@@IDENTIFIED=FALSE")  
