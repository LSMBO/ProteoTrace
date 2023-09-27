from Proline import Proline
import pickle
import argparse
import random, string
from Bio import SeqIO
import os

parser = argparse.ArgumentParser()
parser.add_argument('-r', help='Proline excel output file')
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
    excel_file_path = args.r
    fasta_file = args.f
    random_suffix = ''.join(random.choices(string.digits, k=4))
    output_file_pkl = os.path.join(args.tmp_path, f"Proline_proteotrace_{random_suffix}.pkl")
    output_file_txt = os.path.join(args.tmp_path, f"Proline_proteotrace_protein_list_{random_suffix}.txt")


    proline = Proline(excel_file_path, fasta_file)
    with open(output_file_pkl, 'wb') as pkl_file:
        pickle.dump(proline, pkl_file)
    
    protein_description_all = [record.description for record in SeqIO.parse(fasta_file, "fasta") if not record.description.startswith('CON_') and not record.description.startswith('###REV###')]
    print(f"RUN_ID={random_suffix}")

    with open(output_file_txt, 'w') as output_file:
        for protein_description in protein_description_all:
            output_file.write(f"{protein_description}\n")
    
elif (args.runID):
    args.runID = args.runID[:-2]
    args.protein_descriptions = strip_list(args.protein_descriptions)
    pkl_file = os.path.join(args.tmp_path, f"Proline_proteotrace_{args.runID}.pkl")  # Utilisez le chemin absolu pour le fichier pkl
    with open(pkl_file, 'rb') as pkl_file:
        proline = pickle.load(pkl_file)
    excel_file_path = proline.excel_file_path
    fasta_file = proline.fasta_file
    proline = Proline(excel_file_path, fasta_file, args.protein_descriptions)
    
    
    for protein_description in args.protein_descriptions:
        found = False
        for proline_protein in proline.proteins:
            if proline_protein.description == protein_description:
                found = True
                proline_protein_transformed_id = proline_protein.id.replace('|', '')
                coverage_file = os.path.join(args.tmp_path, f"Proline_proteotrace_{args.runID}_{proline_protein_transformed_id}_coverage.txt")  # Utilisez le chemin absolu pour le fichier de couverture
                proline_protein.get_sequence_coverage(coverage_file)
                print(f"LOG=PROTEIN_ID={description_to_id(protein_description)}@@IDENTIFIED=TRUE")
                print(f"LOG=PROTEIN_ID={description_to_id(protein_description)}@@COVERAGE_FILE={coverage_file}")
                break
        if not found:
            print(f"LOG=PROTEIN_ID={description_to_id(protein_description)}@@IDENTIFIED=FALSE")
